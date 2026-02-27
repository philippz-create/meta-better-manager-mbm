import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;

  if (!token || token.startsWith("your_")) {
    return NextResponse.json({
      valid: false,
      message: "Kein Token konfiguriert",
    });
  }

  try {
    // Check token validity via debug_token endpoint
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (appId && appSecret) {
      const appToken = `${appId}|${appSecret}`;
      const res = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${token}&access_token=${appToken}`
      );
      const data = await res.json();

      if (data.data) {
        const info = data.data;
        return NextResponse.json({
          valid: info.is_valid,
          expires_at: info.expires_at
            ? new Date(info.expires_at * 1000).toISOString()
            : null,
          scopes: info.scopes || [],
          app_id: info.app_id,
          message: info.is_valid
            ? info.expires_at
              ? `Gültig bis ${new Date(info.expires_at * 1000).toLocaleDateString("de-DE")}`
              : "Gültig (kein Ablaufdatum)"
            : "Token abgelaufen oder ungültig",
        });
      }
    }

    // Fallback: test with a simple /me call
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${token}`
    );
    const meData = await meRes.json();

    return NextResponse.json({
      valid: !meData.error,
      message: meData.error ? meData.error.message : `Token gültig (User: ${meData.name})`,
    });
  } catch {
    return NextResponse.json({
      valid: false,
      message: "Token-Prüfung fehlgeschlagen",
    });
  }
}
