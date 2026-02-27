import { NextResponse } from "next/server";
import { getAdSets, createAdSet, updateAdSet } from "@/lib/meta-api";
import type { CreateAdSetPayload } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id") || undefined;
    const adSets = await getAdSets(campaignId);
    return NextResponse.json(adSets);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateAdSetPayload = await request.json();
    const result = await createAdSet(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...payload } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Ad Set ID is required" },
        { status: 400 }
      );
    }
    const result = await updateAdSet(id, payload);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
