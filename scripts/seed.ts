import { db } from "../lib/db/index";
import { videos } from "../lib/db/schema";
import { getExistingCategories } from "../lib/db/queries";
import { fetchAllVideos } from "../lib/youtube/data-api";
import { fetchTranscript } from "../lib/youtube/transcript";
import { summarizeTranscript } from "../lib/llm/summarize";
import { sleep } from "../lib/utils";
import { eq, sql } from "drizzle-orm";

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : 5;

async function main() {
  console.log(`Seeding with limit=${limit}`);
  const allVideos = await fetchAllVideos({ limit });
  console.log(`Fetched ${allVideos.length} videos from YouTube Data API`);

  for (const meta of allVideos) {
    console.log(`\nProcessing: [${meta.vidId}] ${meta.title}`);

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
        await sleep(500);
      } else {
        console.log("  No transcript available");
      }
    } else {
      console.log("  Transcript already stored");
    }

    if (transcript && !existing?.summary) {
      console.log("  Generating summary...");
      const existingCategories = await getExistingCategories();
      const summary = await summarizeTranscript(transcript, existingCategories);
      await db
        .update(videos)
        .set({ summary, updatedAt: sql`now()` })
        .where(eq(videos.vidId, meta.vidId));
      console.log(`  Summary stored. Categories: ${summary.categories.join(", ")}`);
      await sleep(500);
    } else if (existing?.summary) {
      console.log("  Summary already stored");
    }
  }

  console.log("\nSeed complete.");
}

main().catch(console.error);
