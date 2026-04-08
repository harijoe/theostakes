import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vidId = request.nextUrl.searchParams.get("vidId") ?? "dQw4w9WgXcQ";

  try {
    const segments = await YoutubeTranscript.fetchTranscript(vidId);
    return NextResponse.json({
      ok: true,
      vidId,
      segments: segments.length,
      preview: segments[0],
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      vidId,
      error: err instanceof Error ? err.message : String(err),
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    });
  }
}
