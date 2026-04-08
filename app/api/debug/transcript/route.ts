import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { fetchTranscript } from "@/lib/youtube/transcript";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vidId = request.nextUrl.searchParams.get("vidId") ?? "dQw4w9WgXcQ";
  const transcript = await fetchTranscript(vidId);

  return NextResponse.json({
    vidId,
    ok: transcript !== null,
    length: transcript?.length ?? 0,
    preview: transcript?.slice(0, 200) ?? null,
  });
}
