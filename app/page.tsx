import { env } from "@/env";
import { db } from "@/lib/db/index";
import { videos } from "@/lib/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { VideoList } from "./video-list";
import { SubscribeForm } from "./subscribe-form";

export const dynamic = "force-static";

export default async function Home() {
  const allVideos = env.POSTGRES_URL
    ? await db.select().from(videos).where(isNotNull(videos.summary)).orderBy(desc(videos.date))
    : [];

  const serialized = allVideos.map((v) => ({
    vidId: v.vidId,
    title: v.title,
    date: v.date.toISOString(),
    url: v.url,
    summary: v.summary,
  }));

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Theo&apos;s Takes</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">
          Key takeaways from{" "}
          <a
            href="https://www.youtube.com/@t3dotgg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Theo&apos;s
          </a>{" "}
          videos, so you don&apos;t have to watch them all.
        </p>
        <SubscribeForm />
      </div>

      {serialized.length === 0 ? (
        <p className="text-zinc-500">No videos yet. Run the seed script to populate.</p>
      ) : (
        <VideoList videos={serialized} />
      )}
    </div>
  );
}
