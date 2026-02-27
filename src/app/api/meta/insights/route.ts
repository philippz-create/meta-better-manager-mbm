import { NextResponse } from "next/server";
import { getCampaignInsights, getAccountInsights } from "@/lib/meta-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");
    const datePreset = searchParams.get("date_preset") || "last_30d";

    const insights = campaignId
      ? await getCampaignInsights(campaignId, datePreset)
      : await getAccountInsights(datePreset);

    return NextResponse.json(insights);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
