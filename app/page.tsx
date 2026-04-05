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
              {video.summary?.oneLiner && (
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  {video.summary.oneLiner}
                </p>
              )}

              {video.summary?.keyTakeaways && video.summary.keyTakeaways.length > 0 && (
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5 pl-4 mb-3 list-disc marker:text-zinc-300 dark:marker:text-zinc-700">
                  {video.summary.keyTakeaways.map((takeaway, i) => (
                    <li key={i}>{takeaway.text}</li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400 dark:text-zinc-500">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-600 dark:hover:text-zinc-300 underline decoration-zinc-300 dark:decoration-zinc-700"
                >
                  {video.title}
                </a>
                <span>&middot;</span>
                <span>
                  {video.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {video.summary?.categories && video.summary.categories.length > 0 && (
                  <>
                    <span>&middot;</span>
                    {video.summary.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800"
                      >
                        {cat}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
