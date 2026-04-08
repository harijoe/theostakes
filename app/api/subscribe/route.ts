import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/index";
import { subscribers } from "@/lib/db/schema";
import { getResend, FROM_ADDRESS } from "@/lib/email/resend";
import { verificationEmail } from "@/lib/email/templates";
import { randomBytes } from "crypto";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const token = randomBytes(32).toString("hex");

  await db
    .insert(subscribers)
    .values({ email, token, verified: false })
    .onConflictDoUpdate({
      target: subscribers.email,
      set: { token, verified: false },
    });

  const { subject, html } = verificationEmail(token);
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject,
    html,
  });

  return NextResponse.json({ message: "Verification email sent" });
}
