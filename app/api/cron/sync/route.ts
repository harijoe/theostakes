import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/lib/db/index";
import { videos } from "@/lib/db/schema";
import { fetchRssFeed } from "@/lib/youtube/rss";
import { fetchTranscript } from "@/lib/youtube/transcript";
import { summarizeTranscript } from "@/lib/llm/summarize";
import { triggerDeploy } from "@/lib/vercel/deploy";
import { eq, isNotNull, sql } from "drizzle-orm";

async function getExistingCategories(): Promise<string[]> {
  const rows = await db
    .select({ summary: videos.summary })
    .from(videos)
    .where(isNotNull(videos.summary));
  const categories = new Set<string>();
  for (const row of rows) {
    for (const cat of row.summary?.categories ?? []) {
      categories.add(cat);
    }
  }
  return Array.from(categories);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feed = await fetchRssFeed();
  let synced = 0;
  let newCount = 0;

  for (const meta of feed) {
    const existing = await db.query.videos.findFirst({
      where: eq(videos.vidId, meta.vidId),
    });

    const isNew = !existing;

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

    let transcript = existing?.transcript ?? null;
    if (!transcript) {
      transcript = await fetchTranscript(meta.vidId);
      if (transcript) {
        await db
          .update(videos)
          .set({ transcript, updatedAt: sql`now()` })
          .where(eq(videos.vidId, meta.vidId));
      }
    }

    if (transcript && !existing?.summary) {
      const existingCategories = await getExistingCategories();
      const summary = await summarizeTranscript(transcript, existingCategories);
      await db
        .update(videos)
        .set({ summary, updatedAt: sql`now()` })
        .where(eq(videos.vidId, meta.vidId));
    }

    synced++;
  }

  if (newCount > 0) {
    await triggerDeploy();
  }

  return NextResponse.json({ synced, new: newCount });
}
