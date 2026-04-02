import { isNotNull } from "drizzle-orm";
import { db } from "./index";
import { videos } from "./schema";

export async function getExistingCategories(): Promise<string[]> {
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
