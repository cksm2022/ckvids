# Revenant — Forgeware 0.04

Forgeware 0.04 adds **Safety Center controls** to the 0.03 social-platform prototype. The 0.01, 0.02, and 0.03 folders are left unchanged.

## Run it

Open `index.html` in a current browser or serve this folder as a static site. It has no bundler/build step. The optional Supabase client is loaded from its official JavaScript CDN.

## New in 0.04

- **Post options:** report the post, mute the author, or block the author.
- **Report reason selection:** spam/scams, harassment, hate/threats, privacy/doxxing, sexual exploitation, illegal/dangerous activity, or other, with optional context.
- **Safety Center:** review the blocked-account list, muted-account list, and submitted reports; remove a block or mute.
- **Hidden-content filtering:** blocked and muted accounts are filtered from Home, Feed, Posts, Explore, and Saved in the prototype.
- **Local demo support:** safety preferences and reports persist in this browser and are included in JSON export.
- **Optional shared persistence:** with the 0.04 schema and Supabase configured, block/mute choices and your own report history persist to your account.
- **Version isolation:** 0.04 has a new local state key and Terms version, so prior builds do not silently bypass the new onboarding gate.

All 0.03 functionality remains available: posts, image/GIF attachments, replies, likes, reposts, bookmarks, polls, following, explore/search, drafts, notifications, communities preview, profile settings, theme accents, font import, and JSON export.

## Demo mode limitations

With blank Supabase values in `config.js`, the app runs locally. Posts, reports, block/mute lists, and profile state are stored in this browser only. No report is sent to a moderation team.

In the shared prototype, reports are recorded privately for the signed-in reporter; the app does **not** currently provide a moderator queue or automatically remove reported content. Blocking/muting is currently applied by the client when rendering these lists. It is not a server-side privacy or access-control boundary, and it does not yet prevent all possible interactions across the service.

## Enable shared Supabase persistence

1. Create or select a Supabase project.
2. Run all of `supabase-schema.sql` in the Supabase SQL Editor. This includes the earlier schema and the new `account_blocks`, `account_mutes`, and `content_reports` tables with row-level security.
3. Put your project URL and browser-safe publishable key in `config.js`. An older project may call the key the anon key.
4. Never expose a service-role key or any secret in browser code.
5. Enable Email/Password sign-in in Supabase Auth and configure your exact site/redirect URLs.
6. Test with separate accounts before sharing the project publicly.

The client can read and change only the signed-in user's own block/mute rows. A reporter can read only reports they submitted; reports cannot be edited or deleted through the client. The new schema is not an independent security audit or a complete moderation system.

## Publish with GitHub Pages

The repository's Pages feature has previously been disabled. To publish this version:

1. Open repository **Settings → Pages** and select **GitHub Actions** as the deployment source.
2. Open **Actions** and choose **Publish Forgeware 0.04 to GitHub Pages**.
3. Select **Run workflow** on `main`.
4. Once the workflow succeeds, open the published URL from the deployment job.

The workflow deploys only `forgeware-004/` as the site root. This does not change the older version folders or configure Supabase automatically.

## Still planned

Real video ingest/transcoding/streaming, persistent DMs and calls, real-time notifications, community roles/moderation, a moderator review queue, server-enforced block semantics, report appeals/audit tooling, abuse rate limits, spam detection, account deletion and backups, mobile apps, accessibility/load testing, full Terms and Privacy Policy, age-assurance design, and launch-region legal review remain future work. See `ROADMAP.md`.
