import { YoutubeTranscript } from "youtube-transcript";

export async function fetchTranscript(vidId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(vidId);
    return segments.map((s) => s.text).join(" ");
  } catch {
    return null;
  }
}
