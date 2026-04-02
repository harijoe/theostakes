import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    POSTGRES_URL: z.string().url().optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    YOUTUBE_API_KEY: z.string().min(1).optional(),
    VERCEL_DEPLOY_HOOK_URL: z.string().url().optional(),
    CRON_SECRET: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    VERCEL_DEPLOY_HOOK_URL: process.env.VERCEL_DEPLOY_HOOK_URL,
    CRON_SECRET: process.env.CRON_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
