import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const ENV_PATH = join(process.cwd(), ".env.local");

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

export async function GET() {
  try {
    const content = await readFile(ENV_PATH, "utf-8");
    const parsed = parseEnv(content);

    // Mask sensitive values for display
    const masked: Record<string, { value: string; masked: string }> = {};
    for (const key of KEYS) {
      const val = parsed[key] || "";
      const isSet = val.length > 0 && !val.startsWith("your_");
      masked[key] = {
        value: val,
        masked: isSet ? maskValue(val) : "",
      };
    }

    return NextResponse.json({ settings: masked, configured: Object.values(masked).some((v) => v.value && !v.value.startsWith("your_")) });
  } catch {
    // No .env.local yet
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

    // Read existing env to preserve other keys
    let existing: Record<string, string> = {};
    try {
      const content = await readFile(ENV_PATH, "utf-8");
      existing = parseEnv(content);
    } catch {
      // File doesn't exist yet
    }

    // Update only provided keys
    for (const key of KEYS) {
      if (key in body && body[key] !== undefined) {
        existing[key] = body[key];
      }
    }

    await writeFile(ENV_PATH, buildEnv(existing), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Einstellungen gespeichert. Starte den Dev-Server neu, damit die Änderungen wirksam werden.",
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
