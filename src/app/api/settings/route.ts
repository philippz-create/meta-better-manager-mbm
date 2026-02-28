import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Writable path inside Docker (mounted as volume for persistence)
const DATA_DIR = join(process.cwd(), "data");
const ENV_PATH = join(DATA_DIR, ".env.local");

const KEYS = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_ACCESS_TOKEN",
  "META_AD_ACCOUNT_ID",
] as const;

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

function buildEnv(values: Record<string, string>): string {
  const lines = [
    "# Meta Marketing API Credentials",
    "# Managed via Settings UI",
    "",
  ];
  for (const key of KEYS) {
    lines.push(`${key}=${values[key] || ""}`);
  }
  lines.push("");
  return lines.join("\n");
}

// Read saved settings from data file, falling back to process.env
function getCurrentValues(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of KEYS) {
    result[key] = process.env[key] || "";
  }
  return result;
}

export async function GET() {
  try {
    // Try reading persisted settings first
    let parsed: Record<string, string>;
    try {
      const content = await readFile(ENV_PATH, "utf-8");
      parsed = parseEnv(content);
      // Sync to process.env so API calls use latest values
      for (const key of KEYS) {
        if (parsed[key]) process.env[key] = parsed[key];
      }
    } catch {
      // No saved file yet – use environment variables
      parsed = getCurrentValues();
    }

    const masked: Record<string, { value: string; masked: string }> = {};
    for (const key of KEYS) {
      const val = parsed[key] || process.env[key] || "";
      const isSet = val.length > 0 && !val.startsWith("your_");
      masked[key] = {
        value: val,
        masked: isSet ? maskValue(val) : "",
      };
    }

    return NextResponse.json({
      settings: masked,
      configured: Object.values(masked).some(
        (v) => v.value && !v.value.startsWith("your_")
      ),
    });
  } catch {
    const empty: Record<string, { value: string; masked: string }> = {};
    for (const key of KEYS) {
      empty[key] = { value: "", masked: "" };
    }
    return NextResponse.json({ settings: empty, configured: false });
  }
}

export async function POST(request: Request) {
  try {
    const body: Record<string, string> = await request.json();

    // Read existing saved settings
    let existing: Record<string, string> = getCurrentValues();
    try {
      const content = await readFile(ENV_PATH, "utf-8");
      existing = { ...existing, ...parseEnv(content) };
    } catch {
      // No file yet
    }

    // Update only provided keys
    for (const key of KEYS) {
      if (key in body && body[key] !== undefined) {
        existing[key] = body[key];
      }
    }

    // Ensure data directory exists
    await mkdir(DATA_DIR, { recursive: true });

    // Write to persistent file
    await writeFile(ENV_PATH, buildEnv(existing), "utf-8");

    // Update process.env immediately so changes take effect without restart
    for (const key of KEYS) {
      if (existing[key]) {
        process.env[key] = existing[key];
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Einstellungen gespeichert und sofort aktiv.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function maskValue(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
}
