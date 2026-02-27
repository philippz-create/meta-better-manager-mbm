import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const ENV_PATH = join(process.cwd(), ".env.local");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    const errorDesc = searchParams.get("error_description") || "Authorization failed";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(errorDesc)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=No+authorization+code+received", request.url)
    );
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      new URL("/settings?error=App+ID+or+Secret+not+configured", request.url)
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${appSecret}` +
        `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent(tokenData.error.message)}`,
          request.url
        )
      );
    }

    const shortLivedToken = tokenData.access_token;

    // Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${appId}` +
        `&client_secret=${appSecret}` +
        `&fb_exchange_token=${shortLivedToken}`
    );
    const longLivedData = await longLivedRes.json();

    const finalToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in;

    // Save token to .env.local
    await updateEnvToken(finalToken);

    const expiryDays = expiresIn ? Math.floor(expiresIn / 86400) : null;
    const successMsg = expiryDays
      ? `Token+gespeichert.+Gültig+für+${expiryDays}+Tage.+Server+neustarten!`
      : "Token+gespeichert.+Server+neustarten!";

    return NextResponse.redirect(
      new URL(`/settings?success=${successMsg}`, request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/settings?error=Token+exchange+failed", request.url)
    );
  }
}

async function updateEnvToken(token: string) {
  let content = "";
  try {
    content = await readFile(ENV_PATH, "utf-8");
  } catch {
    // File doesn't exist
  }

  const lines = content.split("\n");
  let found = false;
  const updated = lines.map((line) => {
    if (line.startsWith("META_ACCESS_TOKEN=")) {
      found = true;
      return `META_ACCESS_TOKEN=${token}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`META_ACCESS_TOKEN=${token}`);
  }

  await writeFile(ENV_PATH, updated.join("\n"), "utf-8");
}
