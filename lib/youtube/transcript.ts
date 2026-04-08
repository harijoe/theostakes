import { YoutubeTranscript } from "youtube-transcript";

function formatTimestamp(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export async function fetchTranscript(vidId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(vidId);
    return segments.map((s) => `[${formatTimestamp(s.offset)}] ${s.text}`).join(" ");
  } catch (err) {
    console.error(`[fetchTranscript] failed for ${vidId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
