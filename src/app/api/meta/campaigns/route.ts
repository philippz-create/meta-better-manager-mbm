import { NextResponse } from "next/server";
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignInsights,
} from "@/lib/meta-api";
import type { CreateCampaignPayload } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withInsights = searchParams.get("insights") === "true";

    const campaigns = await getCampaigns();

    if (withInsights && campaigns.data.length > 0) {
      const datePreset = searchParams.get("date_preset") || "last_30d";
      const campaignsWithInsights = await Promise.all(
        campaigns.data.map(async (campaign) => {
          try {
            const insights = await getCampaignInsights(
              campaign.id,
              datePreset
            );
            return { ...campaign, insights: insights.data?.[0] || null };
          } catch {
            return { ...campaign, insights: null };
          }
        })
      );
      return NextResponse.json({ data: campaignsWithInsights });
    }

    return NextResponse.json(campaigns);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateCampaignPayload = await request.json();
    const result = await createCampaign(body);
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
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }
    const result = await updateCampaign(id, payload);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }
    const result = await deleteCampaign(id);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
