import { NextResponse } from "next/server";
import { getAds, createAd } from "@/lib/meta-api";
import type { CreateAdPayload } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adSetId = searchParams.get("adset_id") || undefined;
    const campaignId = searchParams.get("campaign_id") || undefined;
    const ads = await getAds({ adSetId, campaignId });
    return NextResponse.json(ads);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateAdPayload = await request.json();
    const result = await createAd(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
