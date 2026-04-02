import { env } from "@/env";

export async function triggerDeploy(): Promise<void> {
  const hookUrl = env.VERCEL_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    console.warn("VERCEL_DEPLOY_HOOK_URL not set, skipping deploy trigger");
    return;
  }
  await fetch(hookUrl, { method: "POST" });
}
