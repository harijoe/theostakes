import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/lib/db/index";
import { videos } from "@/lib/db/schema";
import { getExistingCategories } from "@/lib/db/queries";
import { fetchRssFeed } from "@/lib/youtube/rss";
import { fetchTranscript } from "@/lib/youtube/transcript";
import { summarizeTranscript } from "@/lib/llm/summarize";
import { triggerDeploy } from "@/lib/vercel/deploy";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feed = await fetchRssFeed();
  const existingCategories = await getExistingCategories();
  let synced = 0;
  let newCount = 0;

  for (const meta of feed) {
    const prevRecord = await db.query.videos.findFirst({
      where: eq(videos.vidId, meta.vidId),
    });

    const isNew = !prevRecord;

    await db
      .insert(videos)
      .values({
        vidId: meta.vidId,
        title: meta.title,
        date: meta.date,
        previewImage: meta.previewImage,
        url: meta.url,
      })
      .onConflictDoUpdate({
        target: videos.vidId,
        set: {
          title: meta.title,
          date: meta.date,
          previewImage: meta.previewImage,
          url: meta.url,
          updatedAt: sql`now()`,
        },
      });

    if (isNew) newCount++;

    let transcript = prevRecord?.transcript ?? null;
    if (!transcript) {
      transcript = await fetchTranscript(meta.vidId);
      if (transcript) {
        await db
          .update(videos)
          .set({ transcript, updatedAt: sql`now()` })
          .where(eq(videos.vidId, meta.vidId));
      } else {
        console.warn(`[sync] no transcript available for ${meta.vidId} ("${meta.title}")`);
      }
    }

    if (transcript && !prevRecord?.summary) {
      try {
        const summary = await summarizeTranscript(transcript, existingCategories);
        await db
          .update(videos)
          .set({ summary, updatedAt: sql`now()` })
          .where(eq(videos.vidId, meta.vidId));
        console.log(`[sync] summarized ${meta.vidId} ("${meta.title}")`);
      } catch (err) {
        console.error(
          `[sync] summarize failed for ${meta.vidId} ("${meta.title}"):`,
          err instanceof Error ? err.message : err
        );
      }
    }

    synced++;
  }

  if (newCount > 0) {
    await triggerDeploy();
  }

  return NextResponse.json({ synced, new: newCount });
}
