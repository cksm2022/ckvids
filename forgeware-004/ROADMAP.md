# Revenant / Forgeware roadmap

This document separates implemented prototype behavior from production requirements. A feature appearing in a prototype does not mean it is safe or ready for a public launch.

## Forgeware 0.04 — implemented prototype

- Separate `forgeware-004/` folder; prior versions remain in place.
- Version-specific local state, onboarding gate, and Terms version.
- Safety Center with blocked accounts, muted accounts, and report history.
- Post-options dialog with report, mute, and block actions.
- Structured report reasons and optional reporter context.
- Filters blocked/muted accounts from Home, Feed, Posts, Explore, and Saved in the front end.
- Persist controls locally in demo mode and to per-user Supabase tables when configured.
- Row-level policies on the new block, mute, and report tables.
- Manual GitHub Pages deployment workflow plus a JavaScript/schema feature check workflow.

## Next: Forgeware 0.05

- Server-enforced block rules for post reads, replies, mentions, search, follows, and message delivery.
- Moderator queue with reviewer-only permissions, status transitions, reason summaries, and audit logging.
- Appeal workflow, policy versioning, reasoned enforcement notices, and clear report outcomes.
- Abuse-resistant reporting (rate limits, duplicate reports, spam controls, and protected reporter information).
- Better account discovery and user profile links, with block/mute controls available directly on profiles.

## Future milestones

- Real video uploads, encoding/transcoding, storage lifecycle rules, and streaming playback.
- Persistent direct messages, delivery/read receipts, typing state, and voice/video calls.
- Real-time and push notifications; persistent communities with roles, channels, invites, and moderation.
- Search index, creator analytics, scheduled posts, synced drafts, livestream tools, and safe monetization.
- Mobile apps, accessibility audits, load/performance testing, backups, restore, export/deletion workflows, and disaster recovery.
- Full Terms of Service and Privacy Policy, data minimization and retention policies, age-assurance/child-safety design, and launch-region legal review.

## Known limitations

- Local demo reports are only saved in the current browser.
- Shared reports are saved privately to the reporter's account, but no web moderator queue or automated review service is built.
- Block/mute enforcement in 0.04 is a client-side display filter. It is not a security boundary and must not be represented as full platform-wide blocking.
- Supabase must be configured by the repository owner. No key or password is bundled in this folder.
