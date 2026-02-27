import { NextResponse } from "next/server";
import {
  getAdCreatives,
  createAdCreative,
  type CreateAdCreativePayload,
} from "@/lib/meta-api";

export async function GET() {
  try {
    const creatives = await getAdCreatives();
    return NextResponse.json(creatives);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateAdCreativePayload = await request.json();
    const result = await createAdCreative(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
