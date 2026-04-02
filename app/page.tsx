import Image from "next/image";
import Link from "next/link";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Theo&apos;s Takes</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          AI-generated summaries of{" "}
          <a
            href="https://www.youtube.com/@t3dotgg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Theo&apos;s
          </a>{" "}
          YouTube videos.
        </p>
      </div>

      {allVideos.length === 0 ? (
        <p className="text-zinc-500">No videos yet. Run the seed script to populate.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allVideos.map((video) => (
            <Link
              key={video.vidId}
              href={`/video/${video.vidId}`}
              className="group flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={video.previewImage}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="flex flex-col flex-1 p-4 gap-2">
                <h2 className="font-semibold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                  {video.title}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {video.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {video.summary?.oneLiner && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                    {video.summary.oneLiner}
                  </p>
                )}
                {video.summary?.categories && video.summary.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto pt-2">
                    {video.summary.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
