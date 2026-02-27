import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "META_APP_ID is not configured. Set it in Settings first." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin") || request.headers.get("origin") || "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/callback`;

  const scopes = [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_read_engagement",
  ].join(",");

  const authUrl =
    `https://www.facebook.com/v21.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code`;

  return NextResponse.json({ url: authUrl });
}
