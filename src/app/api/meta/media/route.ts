import { NextResponse } from "next/server";
import { getAdImages, uploadAdImage, uploadAdVideo } from "@/lib/meta-api";

export async function GET() {
  try {
    const images = await getAdImages();
    return NextResponse.json(images);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const isVideo = file.type.startsWith("video/");

    if (isVideo) {
      const result = await uploadAdVideo(
        bytes,
        file.name,
        title || undefined
      );
      return NextResponse.json(
        { type: "video", ...result },
        { status: 201 }
      );
    } else {
      const result = await uploadAdImage(bytes, file.name);
      return NextResponse.json(
        { type: "image", ...result },
        { status: 201 }
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
