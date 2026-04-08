import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/lib/db/index";
import { videos, subscribers } from "@/lib/db/schema";
import { getExistingCategories } from "@/lib/db/queries";
import { fetchRssFeed } from "@/lib/youtube/rss";
import { fetchTranscript } from "@/lib/youtube/transcript";
import { summarizeTranscript } from "@/lib/llm/summarize";
import { triggerDeploy } from "@/lib/vercel/deploy";
import { getResend, FROM_ADDRESS } from "@/lib/email/resend";
import { newVideoDigestEmail } from "@/lib/email/templates";
import { eq, sql } from "drizzle-orm";
import type { VideoSummary } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feed = await fetchRssFeed();
  const existingCategories = await getExistingCategories();
  let synced = 0;
  let newCount = 0;
  const newVideos: Array<{ title: string; url: string; summary: VideoSummary | null }> = [];

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

    if (isNew) {
      newCount++;
      newVideos.push({ title: meta.title, url: meta.url, summary: null });
    }

    let transcript = prevRecord?.transcript ?? null;
    if (!transcript) {
      transcript = await fetchTranscript(meta.vidId);
      if (transcript) {
        await db
          .update(videos)
          .set({ transcript, updatedAt: sql`now()` })
          .where(eq(videos.vidId, meta.vidId));
      }
    }

    if (transcript && !prevRecord?.summary) {
      const summary = await summarizeTranscript(transcript, existingCategories);
      await db
        .update(videos)
        .set({ summary, updatedAt: sql`now()` })
        .where(eq(videos.vidId, meta.vidId));
      if (isNew) {
        const newVideo = newVideos.find((v) => v.url === meta.url);
        if (newVideo) newVideo.summary = summary;
      }
    }

    synced++;
  }

  if (newCount > 0) {
    await triggerDeploy();

    const verifiedSubs = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.verified, true));

    if (verifiedSubs.length > 0) {
      const resend = getResend();
      await Promise.allSettled(
        verifiedSubs.map((sub) => {
          const { subject, html } = newVideoDigestEmail(newVideos, sub.token);
          return resend.emails.send({
            from: FROM_ADDRESS,
            to: sub.email,
            subject,
            html,
          });
        })
      );
    }
  }

  return NextResponse.json({ synced, new: newCount });
}
