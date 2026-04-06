import { db } from "../lib/db/index";
import { videos } from "../lib/db/schema";
import { getExistingCategories } from "../lib/db/queries";
import { summarizeTranscript } from "../lib/llm/summarize";
import { sleep } from "../lib/utils";
import { desc, eq, isNotNull, sql } from "drizzle-orm";

const vidIdArg = process.argv.indexOf("--vid-id");
const targetVidId = vidIdArg !== -1 ? process.argv[vidIdArg + 1] : null;

const lastArg = process.argv.indexOf("--last");
const lastN = lastArg !== -1 ? parseInt(process.argv[lastArg + 1], 10) : null;

async function main() {
  const rows = targetVidId
    ? await db.query.videos.findMany({ where: eq(videos.vidId, targetVidId) })
    : await db.query.videos.findMany({
        where: isNotNull(videos.transcript),
        orderBy: [desc(videos.date)],
        limit: lastN ?? undefined,
      });

  const withTranscript = rows.filter((r) => r.transcript != null);
  console.log(`Regenerating summaries for ${withTranscript.length} video(s)`);

  for (const video of withTranscript) {
    console.log(`\nProcessing: [${video.vidId}] ${video.title}`);
    const existingCategories = await getExistingCategories();
    const summary = await summarizeTranscript(video.transcript!, existingCategories);
    await db
      .update(videos)
      .set({ summary, updatedAt: sql`now()` })
      .where(eq(videos.vidId, video.vidId));
    console.log(`  Done. Categories: ${summary.categories.join(", ")}`);
    await sleep(500);
  }

  console.log("\nDone.");
}

main().catch(console.error);
