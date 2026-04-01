import type { VideoMeta } from "./rss";

const CHANNEL_ID = "UCbRP3c757lWg9M-U7TyEkXA";
const BASE = "https://www.googleapis.com/youtube/v3";

async function getUploadsPlaylistId(apiKey: string): Promise<string> {
  const url = `${BASE}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Channels API failed: ${res.status}`);
  const data = await res.json();
  return data.items[0].contentDetails.relatedPlaylists.uploads as string;
}

export async function fetchAllVideos(options: { limit?: number } = {}): Promise<VideoMeta[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const playlistId = await getUploadsPlaylistId(apiKey);
  const videos: VideoMeta[] = [];
  let pageToken: string | undefined;

  while (true) {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: "50",
      key: apiKey,
      ...(pageToken ? { pageToken } : {}),
    });

    const res = await fetch(`${BASE}/playlistItems?${params}`);
    if (!res.ok) throw new Error(`PlaylistItems API failed: ${res.status}`);
    const data = await res.json();

    for (const item of data.items) {
      const snippet = item.snippet;
      const vidId = snippet.resourceId.videoId as string;
      videos.push({
        vidId,
        title: snippet.title as string,
        date: new Date(snippet.publishedAt as string),
        previewImage:
          (snippet.thumbnails?.high?.url as string) ??
          `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${vidId}`,
      });

      if (options.limit && videos.length >= options.limit) return videos;
    }

    pageToken = data.nextPageToken as string | undefined;
    if (!pageToken) break;
  }

  return videos;
}
