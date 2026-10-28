# Revenant / Forgeware roadmap

## Forgeware 0.05 - public-release candidate prototype
- Persistent direct messages with sender/recipient access policies and recipient read receipts.
- Realtime recipient notifications for messages; database-triggered notifications for replies, likes and follows.
- Persistent community creation, owner membership, join/leave, member counts and community-specific posts.
- Search profiles and post text against Supabase instead of only a local recent-post slice.
- Public image and video attachments using Supabase Storage; videos up to 50 MB render in posts and Reels.
- Privacy-notice route and PRIVACY.md review checklist.
- Versioned onboarding and dedicated validation/manual-deployment workflows.
- Moderation queue and reviewer tooling intentionally excluded at the user's request.

## Remaining before a wide public opening
- Operator-built moderation workflows, report triage, enforcement, appeals and audit logs.
- Server-enforced block behavior across search, feeds, follows, DMs and communities.
- Complete Terms of Service and a completed/reviewed privacy policy with operator identity, jurisdiction, contact, rights, retention and deletion terms.
- Reliable account deletion, complete user data export, media deletion/retention, backups and restore drills.
- Age-safety design beyond birthday self-declaration, legal review and launch readiness signoff.
- Monitoring, abuse rate limits, incident response, accessibility and performance testing.

## Later feature milestones
- Video transcoding/adaptive streaming, scanning and upload quotas.
- Voice/video calls, push notifications, scheduled posts and synced drafts.
- Community roles and moderation tools, creator analytics, livestreaming and monetization.
- Mobile clients, improved profile editing, advanced discovery and a proper search index.
