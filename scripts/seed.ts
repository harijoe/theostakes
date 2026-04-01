import "dotenv/config";
import { db } from "../lib/db/index";
import { videos } from "../lib/db/schema";
import { fetchAllVideos } from "../lib/youtube/data-api";
import { fetchTranscript } from "../lib/youtube/transcript";
import { summarizeTranscript } from "../lib/llm/summarize";
import { eq, isNotNull, sql } from "drizzle-orm";

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : 5;

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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Seeding with limit=${limit}`);
  const allVideos = await fetchAllVideos({ limit });
  console.log(`Fetched ${allVideos.length} videos from YouTube Data API`);

  for (const meta of allVideos) {
    console.log(`\nProcessing: [${meta.vidId}] ${meta.title}`);

    // Upsert metadata
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

    // Fetch transcript if missing
    const existing = await db.query.videos.findFirst({
      where: eq(videos.vidId, meta.vidId),
    });

    let transcript = existing?.transcript ?? null;
    if (!transcript) {
      console.log("  Fetching transcript...");
      transcript = await fetchTranscript(meta.vidId);
      if (transcript) {
        await db
          .update(videos)
          .set({ transcript, updatedAt: sql`now()` })
          .where(eq(videos.vidId, meta.vidId));
        console.log(`  Transcript stored (${transcript.length} chars)`);
      } else {
        console.log("  No transcript available");
      }
    } else {
      console.log("  Transcript already stored");
    }

    // Generate summary if missing
    if (transcript && !existing?.summary) {
      console.log("  Generating summary...");
      await sleep(500);
      const existingCategories = await getExistingCategories();
      const summary = await summarizeTranscript(transcript, existingCategories);
      await db
        .update(videos)
        .set({ summary, updatedAt: sql`now()` })
        .where(eq(videos.vidId, meta.vidId));
      console.log(`  Summary stored. Categories: ${summary.categories.join(", ")}`);
    } else if (existing?.summary) {
      console.log("  Summary already stored");
    }

    await sleep(500);
  }

  console.log("\nSeed complete.");
}

main().catch(console.error);
