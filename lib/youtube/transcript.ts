const INNERTUBE_URL =
  "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";

// Multiple clients tried in order — cloud IPs may be blocked for some but not all.
const CLIENTS = [
  {
    name: "ANDROID",
    clientName: "ANDROID",
    clientVersion: "20.10.38",
    userAgent:
      "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip",
  },
  {
    name: "WEB_EMBEDDED_PLAYER",
    clientName: "WEB_EMBEDDED_PLAYER",
    clientVersion: "2.20250402.01.00",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  },
  {
    name: "TVHTML5",
    clientName: "TVHTML5",
    clientVersion: "7.20250401.19.00",
    userAgent:
      "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1",
  },
] as const;

type CaptionTrack = { languageCode: string; baseUrl: string };

async function fetchCaptionTracks(
  vidId: string
): Promise<CaptionTrack[] | null> {
  for (const client of CLIENTS) {
    try {
      const res = await fetch(INNERTUBE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": client.userAgent,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: client.clientName,
              clientVersion: client.clientVersion,
            },
          },
          videoId: vidId,
        }),
      });

      if (!res.ok) {
        console.warn(
          `[transcript] ${client.name} HTTP ${res.status} for ${vidId}`
        );
        continue;
      }

      const data = await res.json();
      const tracks: CaptionTrack[] | undefined =
        data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (Array.isArray(tracks) && tracks.length > 0) {
        console.log(
          `[transcript] got ${tracks.length} track(s) via ${client.name} for ${vidId}`
        );
        return tracks;
      }

      const playability = data?.playabilityStatus?.status ?? "unknown";
      console.warn(
        `[transcript] ${client.name} returned no tracks for ${vidId} (playabilityStatus=${playability})`
      );
    } catch (err) {
      console.warn(
        `[transcript] ${client.name} threw for ${vidId}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.error(`[transcript] all clients failed for ${vidId}`);
  return null;
}

function formatTimestamp(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseTranscriptXml(
  xml: string
): Array<{ text: string; offset: number }> {
  const segments: Array<{ text: string; offset: number }> = [];
  // Match both <text start="..." dur="...">...</text> and <p t="..." d="...">...</p> formats
  const textRe = /<text start="([^"]*)" dur="([^"]*)">([^<]*(?:<[^/][^<]*>(?:[^<]*)<\/[^>]+>[^<]*)*)<\/text>/g;
  const pRe = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;

  let match: RegExpExecArray | null;

  // Try <text> format first (XML)
  while ((match = textRe.exec(xml)) !== null) {
    const text = match[3]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
        String.fromCodePoint(parseInt(h, 16))
      )
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
      .trim();
    if (text)
      segments.push({ text, offset: Math.round(parseFloat(match[1]) * 1000) });
  }

  if (segments.length > 0) return segments;

  // Try <p> format (JSON3/srv3)
  while ((match = pRe.exec(xml)) !== null) {
    const raw = match[3].replace(/<[^>]+>/g, "").trim();
    const text = raw
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (text) segments.push({ text, offset: parseInt(match[1], 10) });
  }

  return segments;
}

export async function fetchTranscript(vidId: string): Promise<string | null> {
  const tracks = await fetchCaptionTracks(vidId);
  if (!tracks) return null;

  // Prefer English; fall back to first available track
  const track =
    tracks.find((t) => t.languageCode === "en") ??
    tracks.find((t) => t.languageCode.startsWith("en")) ??
    tracks[0];

  if (!track?.baseUrl) {
    console.error(`[transcript] no usable track for ${vidId}`);
    return null;
  }

  try {
    const res = await fetch(track.baseUrl);
    if (!res.ok) {
      console.error(
        `[transcript] caption XML fetch HTTP ${res.status} for ${vidId}`
      );
      return null;
    }

    const xml = await res.text();
    const segments = parseTranscriptXml(xml);

    if (segments.length === 0) {
      console.error(`[transcript] parsed 0 segments for ${vidId}`);
      return null;
    }

    return segments
      .map((s) => `[${formatTimestamp(s.offset)}] ${s.text}`)
      .join(" ");
  } catch (err) {
    console.error(
      `[transcript] caption XML fetch threw for ${vidId}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
