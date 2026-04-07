"use client";

import { useState, useEffect } from "react";
import type { VideoSummary } from "@/lib/db/schema";

type Video = {
  vidId: string;
  title: string;
  date: string;
  url: string;
  summary: VideoSummary | null;
};

const PAGE_SIZE = 5;

export function VideoList({ videos }: { videos: Video[] }) {
  const [page, setPage] = useState(0);
  const [seenBefore, setSeenBefore] = useState<string | null>(null);

  useEffect(() => {
    const key = "lastVisitAt";
    const prev = localStorage.getItem(key);
    localStorage.setItem(key, new Date().toISOString());
    if (prev) setSeenBefore(prev);
  }, []);

  const totalPages = Math.ceil(videos.length / PAGE_SIZE);
  const pageVideos = videos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {pageVideos.map((video) => {
          const isNew = seenBefore !== null && video.date > seenBefore;
          return (
          <article key={video.vidId} className={`py-6 first:pt-0 pl-3 border-l-2 ${isNew ? "border-blue-400 dark:border-blue-500" : "border-transparent"}`}>
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
                {new Date(video.date).toLocaleDateString("en-US", {
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
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-sm px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-sm px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
