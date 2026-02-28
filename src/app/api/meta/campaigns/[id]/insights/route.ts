import { NextResponse } from "next/server";
import { getCampaignInsights } from "@/lib/meta-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const datePreset = searchParams.get("date_preset") || "last_30d";
    const insights = await getCampaignInsights(id, datePreset);
    return NextResponse.json(insights);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
