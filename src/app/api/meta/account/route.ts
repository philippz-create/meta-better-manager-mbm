import { NextResponse } from "next/server";
import { getAdAccount, getAccountInsights } from "@/lib/meta-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInsights = searchParams.get("insights") === "true";

    const account = await getAdAccount();
    let insights = null;

    if (includeInsights) {
      const datePreset = searchParams.get("date_preset") || "last_30d";
      const insightsRes = await getAccountInsights(datePreset);
      insights = insightsRes.data?.[0] || null;
    }

    return NextResponse.json({ account, insights });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
