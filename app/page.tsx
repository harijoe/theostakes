import { env } from "@/env";
import { db } from "@/lib/db/index";
import { videos } from "@/lib/db/schema";
import { desc, isNotNull } from "drizzle-orm";

export const dynamic = "force-static";

export default async function Home() {
  const allVideos = env.POSTGRES_URL
    ? await db.select().from(videos).where(isNotNull(videos.summary)).orderBy(desc(videos.date))
    : [];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Theo&apos;s Takes</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
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
      </div>

      {allVideos.length === 0 ? (
        <p className="text-zinc-500">No videos yet. Run the seed script to populate.</p>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {allVideos.map((video) => (
            <article key={video.vidId} className="py-6 first:pt-0">
              <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                <h2 className="font-semibold leading-snug">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {video.title}
                  </a>
                </h2>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                  {video.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {video.summary?.categories && video.summary.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {video.summary.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {video.summary?.oneLiner && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                  {video.summary.oneLiner}
                </p>
              )}

              {video.summary?.keyTakeaways && video.summary.keyTakeaways.length > 0 && (
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5 pl-4 list-disc marker:text-zinc-300 dark:marker:text-zinc-700">
                  {video.summary.keyTakeaways.map((takeaway, i) => (
                    <li key={i}>{takeaway.text}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
