# Changelog

## [0.1.0.0] - 2026-04-06

### Added
- Email subscription with double opt-in: users enter their email on the homepage and receive a verification link before getting any notifications
- `POST /api/subscribe` — validates and stores subscriber, sends verification email via Resend
- `GET /api/verify?token=` — confirms email address, shows HTML confirmation page
- `GET /api/unsubscribe?token=` — removes subscriber from list, shows confirmation page
- Verified subscribers automatically receive a digest email when new videos are synced (cron job)
- `subscribers` database table (email, token, verified, createdAt)
- RESEND_API_KEY environment variable support

### Changed
- Homepage now shows an email subscription form below the site description
- Site redesigned as scannable single-page layout with AI-generated opinionated summaries
- Videos paginated client-side at 5 per page
- Improved visual hierarchy: one-liner leads, video title demoted to metadata
- Cron schedule set to daily (Vercel hobby tier limit)
- Site metadata updated (title, description)

### Added (infrastructure)
- Full video summarization pipeline with Claude AI
- YouTube RSS feed fetching and transcript retrieval
- Drizzle ORM + Neon PostgreSQL database integration
- Environment variable validation via @t3-oss/env-nextjs
- Vercel deploy hook integration
