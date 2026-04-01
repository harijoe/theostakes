import { XMLParser } from "fast-xml-parser";

const CHANNEL_ID = "UCbRP3c757lWg9M-U7TyEkXA";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export type VideoMeta = {
  vidId: string;
  title: string;
  date: Date;
  previewImage: string;
  url: string;
};

export async function fetchRssFeed(): Promise<VideoMeta[]> {
  const res = await fetch(RSS_URL, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml);

  const entries = parsed?.feed?.entry ?? [];
  const items: typeof entries = Array.isArray(entries) ? entries : [entries];

  return items.map((entry: Record<string, unknown>) => {
    const vidId = String(entry["yt:videoId"]);
    const mediaGroup = entry["media:group"] as Record<string, unknown>;
    const mediaThumbnail = mediaGroup?.["media:thumbnail"] as Record<string, unknown>;
    const previewImage =
      String(mediaThumbnail?.["@_url"] ?? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`);

    return {
      vidId,
      title: String(entry.title),
      date: new Date(String(entry.published)),
      previewImage,
      url: `https://www.youtube.com/watch?v=${vidId}`,
    };
  });
}
