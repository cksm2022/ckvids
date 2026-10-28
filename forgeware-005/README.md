# Revenant - Forgeware 0.05 Public Release Candidate

Forgeware 0.05 is the first public-release candidate in its own folder. Versions 0.01-0.04 remain unchanged. It adds persistent messaging, shared communities, cross-account search, video post uploads, video discovery, and database-triggered in-app notifications. The moderation queue is deliberately not included; that remains the operator's own project.

## Features
- Supabase-backed direct messages with participant-only row-level security and recipient read receipts.
- Realtime in-app notifications for new messages, follows, likes and replies through database triggers and Supabase Realtime.
- Persistent community creation, owner membership, join/leave, member counts and community-specific posts.
- Search public usernames and post text through Supabase.
- Upload images up to 8 MB and MP4/WebM/MOV videos up to 50 MB to public post storage.
- Uploaded videos render in posts and the Reels page.
- Privacy notice route and review checklist.
- Existing posts, profiles, polls, follow/bookmark features, notifications and 0.04 safety controls are retained.

## Setup required for cloud features
1. Create or select a Supabase project.
2. Run the complete supabase-schema.sql file in the SQL Editor.
3. Put the Project URL and browser-safe publishable key in config.js. Never put a service-role secret in browser code.
4. Enable Email/Password authentication and configure the correct site and redirect URLs.
5. Confirm direct_messages and notifications are enabled in the supabase_realtime publication after running the schema.
6. Test with two separate accounts: signup, send/read messages, create/join a community, publish a community post, search users/posts, upload a video and verify participant-only message access.
7. Configure repository Settings -> Pages to use GitHub Actions, then run Publish Forgeware 0.05 to GitHub Pages.

Blank config means the app stays in local demo mode. Messages, shared communities, cloud people search, video uploads and cross-device notifications need Supabase and do not work cross-device in local demo mode.

## Media limits
The UI accepts image MIME types and MP4/WebM/QuickTime videos. Videos are capped at 50 MB and use the public post-media bucket. This is direct upload and native browser playback only; there is no transcoding, adaptive bitrate streaming, malware scanning, content fingerprinting or automated quota management.

## Moderation status
The moderation queue and moderator controls are intentionally not included. The 0.04 report submission UI and report records remain in the copied Safety Center, but 0.05 adds no reviewer console, automated enforcement or response workflow. Those controls are for the operator to build. The existing block/mute interface remains a client-side filter, not universal enforcement.

## Before a broad public launch
This candidate has passed source/static validation, not an independent security or load audit. Verify policies with separate accounts, malicious test inputs and Supabase logs. Complete legal review of Terms and privacy text for the launch region; the in-app privacy route is a disclosure draft, not a legally complete privacy policy. Add an operator contact, retention periods, deletion/export handling, age-safety measures and your moderation process. Configure backups, abuse controls, monitoring and incident response before opening widely.
