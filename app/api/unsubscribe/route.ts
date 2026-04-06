import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const successHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:24px;color:#18181b;text-align:center;">
  <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Unsubscribed</h1>
  <p style="color:#71717a;">You've been removed from the Theo's Takes mailing list.</p>
  <a href="/" style="display:inline-block;margin-top:24px;color:#18181b;font-weight:600;">← Back to Theo's Takes</a>
</body>
</html>`;

const errorHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invalid link</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:24px;color:#18181b;text-align:center;">
  <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Invalid link</h1>
  <p style="color:#71717a;">This unsubscribe link is invalid or already used.</p>
  <a href="/" style="display:inline-block;margin-top:24px;color:#18181b;font-weight:600;">← Back to Theo's Takes</a>
</body>
</html>`;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse(errorHtml, { status: 400, headers: { "Content-Type": "text/html" } });
  }

  const result = await db
    .delete(subscribers)
    .where(eq(subscribers.token, token))
    .returning({ email: subscribers.email });

  if (result.length === 0) {
    return new NextResponse(errorHtml, { status: 404, headers: { "Content-Type": "text/html" } });
  }

  return new NextResponse(successHtml, { status: 200, headers: { "Content-Type": "text/html" } });
}
