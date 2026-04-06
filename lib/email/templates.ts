import { BASE_URL } from "./resend";
import type { VideoSummary } from "@/lib/db/schema";

export function verificationEmail(token: string): { subject: string; html: string } {
  const verifyUrl = `${BASE_URL}/api/verify?token=${token}`;
  return {
    subject: "Confirm your subscription to Theo's Takes",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;">
  <h1 style="font-size:20px;font-weight:700;margin-bottom:8px;">Theo's Takes</h1>
  <p style="color:#71717a;margin-bottom:24px;">AI-powered summaries of Theo's YouTube videos</p>
  <p>Click the button below to confirm your email address and start receiving notifications when new videos are summarized.</p>
  <a href="${verifyUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Confirm subscription</a>
  <p style="color:#71717a;font-size:12px;margin-top:32px;">If you didn't subscribe, you can safely ignore this email.</p>
</body>
</html>`,
  };
}

export function newVideoDigestEmail(
  videos: Array<{ title: string; url: string; summary: VideoSummary | null }>,
  unsubscribeToken: string
): { subject: string; html: string } {
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${unsubscribeToken}`;

  const videoBlocks = videos
    .map((v) => {
      const oneLiner = v.summary?.oneLiner ?? "";
      const takeaways = v.summary?.keyTakeaways ?? [];
      const takeawayHtml = takeaways
        .map((t) => `<li style="margin-bottom:4px;">${t.text}</li>`)
        .join("");
      return `
      <div style="border:1px solid #e4e4e7;border-radius:8px;padding:16px;margin-bottom:16px;">
        <h2 style="font-size:16px;font-weight:600;margin:0 0 8px;">${v.title}</h2>
        ${oneLiner ? `<p style="color:#52525b;margin:0 0 12px;font-style:italic;">${oneLiner}</p>` : ""}
        ${takeawayHtml ? `<ul style="margin:0;padding-left:20px;color:#3f3f46;">${takeawayHtml}</ul>` : ""}
        <a href="${v.url}" style="display:inline-block;margin-top:12px;color:#18181b;font-weight:600;font-size:13px;">Watch on YouTube →</a>
      </div>`;
    })
    .join("");

  const count = videos.length;
  const subject =
    count === 1
      ? `New video: ${videos[0].title}`
      : `${count} new videos on Theo's Takes`;

  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;">
  <h1 style="font-size:20px;font-weight:700;margin-bottom:4px;">Theo's Takes</h1>
  <p style="color:#71717a;margin-bottom:24px;">New ${count === 1 ? "video" : "videos"} just summarized</p>
  ${videoBlocks}
  <p style="color:#a1a1aa;font-size:12px;margin-top:32px;">
    <a href="${unsubscribeUrl}" style="color:#a1a1aa;">Unsubscribe</a>
  </p>
</body>
</html>`,
  };
}
