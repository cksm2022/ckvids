# Revenant — Forgeware 0.03

Forgeware 0.03 is a larger iteration of the Revenant black-and-red social platform prototype. Versions 0.01 and 0.02 remain in their original folders.

## Open it

Open `index.html` in a current browser, or serve this directory as a static site. This build has no local bundler or build step. The optional Supabase client is loaded from its official JavaScript CDN.

## Features in Forgeware 0.03

- Version-specific onboarding: birthday declaration, “Welcome to Reven,” the “Burch” joke, the six rules, explicit confirmation, and account/demo setup.
- Responsive black-and-red UI with Home, Feed, Posts, Reels, Explore, Saved, Notifications, Drafts, Communities, Messages, Profile, Settings, and Terms.
- Slash-style navigation and command bar; use Ctrl/Cmd+K or type /.
- Explore/search over available posts, category filters, trending-topic shortcuts, and saved posts.
- Post composer with text styles, image/GIF attachments, locally autosaved drafts, and poll creation.
- Poll voting and result percentages in local mode. Shared poll creation and aggregate results when the Forgeware 0.03 schema has been applied.
- Likes, replies with font choices, reposts, bookmarks, local notifications, follow/unfollow controls, a personalized Feed, and basic community join/create previews.
- Editable profile name and bio, customizable accent theme, direct TTF/OTF/WOFF/WOFF2 font preview, and JSON export.
- Optional Supabase email/password auth and shared profiles, posts, comments, likes, bookmarks, follows, post media, and polls with row-level security.

## Demo mode

If config.js has blank Supabase values, the app creates a local demo profile. Demo posts, votes, drafts, notifications, bookmarks, and community memberships are stored in this browser only. They are not shared with another person or device.

The generated password in quick demo setup is a UI demonstration only. It does not authenticate a server account. For real authentication, configure Supabase below.

## Enable shared accounts and posts

1. Create a project in Supabase.
2. Open its SQL Editor and run all of `supabase-schema.sql` from this folder. This schema updates the earlier posts table for poll support.
3. Copy the Supabase Project URL and publishable key (older projects may call it the anon key).
4. Place those two values in config.js as supabaseUrl and supabasePublishableKey.
5. Never put a Supabase service_role key or any other secret key in browser code.
6. Enable email/password sign-in in Supabase Auth, and set the Site URL and allowed redirect URLs to the exact location where you host this project.
7. Open the site, complete the onboarding and Terms flow, then create an account. Email verification may be required depending on your Supabase Auth settings.

The client uses the publishable key and relies on database Row Level Security policies. Review/test those policies before inviting real users; this prototype has not received an independent security audit.

## Hosting

GitHub stores the source; it does not automatically make the site live. GitHub Pages must be enabled in repository settings before a public URL will work. The repository's Pages setting was not changed by this source-code update. Static hosting does not replace Supabase.

## Intentionally future work

Forgeware 0.03 is not trying to ship the entire imagined platform. The following are still future milestones:

- Real video uploads, encoding/transcoding, streaming playback, moderation scanning, and storage lifecycle limits.
- Live chat, reliable real-time messaging, voice/video calls, read receipts, typing indicators, and encrypted private conversations.
- Persistent communities with channels, roles, moderator tools, invitations, and server-side membership.
- Server-generated notifications, push notifications, follows, feeds based on followed accounts, ranking controls, and reliable trending analytics.
- Dedicated reporting and moderation queues, blocking/muting across the service, appeal flows, rate limits, spam and abuse detection, and audit logs.
- Animated profile-picture editor, profile decorations, custom theme marketplace, uploaded font hosting, ZIP font extraction, isolated server-side conversion, and licence review.
- Creator analytics, livestream tools, scheduled posts, drafts synced across devices, poll closing times, more poll types, and polls in communities.
- Search indexing, mobile applications, accessibility audits, performance load tests, backup/restore, account deletion flows, and administrative tooling.
- Complete Terms of Service and Privacy Policy, age-assurance and child-safety design, data retention rules, and a launch-region legal review.

## Files

- index.html — application shell
- styles.css — responsive UI and components
- app.js — navigation, onboarding, local demo state, and optional Supabase integration
- config.js — blank client-side backend configuration
- supabase-schema.sql — database schema, polls, RLS rules, and media bucket policies
- ROADMAP.md — current milestone boundaries and the next planned milestones
