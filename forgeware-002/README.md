# Revenant — Forgeware 0.02

Forgeware 0.02 is a separate iteration of the Revenant prototype. Forgeware 0.01 remains untouched in forgeware-001/.

## Try the prototype

Open index.html in a modern browser or host this directory as a static site. It uses a stylesheet, one application script, and the Supabase JavaScript client CDN. No local build tools are required.

## What changed in 0.02

- Version-specific first-visit flags. A fresh 0.02 install starts with the birthday gate, then the “Welcome to Reven” rules screen. Clicking Agree without opening the rules shows the “Burch” joke and sends the visitor to the rules.
- Terms acceptance is recorded as a versioned acknowledgement. Settings contains Reset onboarding so the first-visit screens can be tested again.
- Black-and-red responsive layout, slash-style command navigation, Posts, Feed, Reels, communities, messaging preview, profile, and settings.
- Local demo mode remains available without backend credentials.
- Optional Supabase integration for email/password accounts, shared posts, profile records, comments, likes, bookmarks, and public post-media attachments.
- supabase-schema.sql defines database tables, row-level security policies, and the post-media bucket policy.

## Local demo mode

When config.js has blank Supabase settings, create a local demo profile. Posts, likes, comments, and bookmarks are stored in the current browser only. They do not sync to other users or devices.

## Enable shared accounts and posts

1. Create a project in the Supabase dashboard.
2. Open the project's SQL Editor and run the full contents of supabase-schema.sql.
3. In Supabase project settings, copy the Project URL and the publishable key (older projects may label it the anon key).
4. Put those two values in config.js:
   - supabaseUrl: your project URL
   - supabasePublishableKey: your publishable/anon key
5. Never put the service_role key or any secret key in config.js or browser code.
6. Enable email/password authentication in Supabase Auth. Configure the Site URL and allowed redirect URLs to match wherever you host the website. If hosted on GitHub Pages for this repo, the likely project URL is https://cksm2022.github.io/ckvids/forgeware-002/ after Pages has been enabled.
7. Reload the website, complete the birthday and Terms gates, then create an account. If confirmation emails are enabled, verify the email before signing in.

The client uses the publishable key; database access relies on the Row Level Security policies in the SQL schema. Review and test these policies before allowing real users. This is an early implementation, not a security audit.

## Hosting

GitHub stores the source. GitHub Pages can serve the static interface, but it does not run the database or provide authentication. The GitHub Pages feature must be enabled in the repository settings; that setting has not been confirmed/enabled by this project.

## Known limitations

- Birthday entry is a self-declaration, not reliable age verification. The actual launch requires an age-safety strategy appropriate to its operating regions.
- The displayed rules are a short community-rules summary, not complete Terms of Service or a Privacy Policy. These need to be authored and reviewed before a public launch.
- Email/password auth and shared Posts work only after the Supabase project is configured and the SQL schema has been applied.
- Reels are styled placeholders; video upload/transcoding, streaming, and real-time delivery are not implemented.
- Direct font files can load for the current browser session. ZIP extraction, server-side font conversion, uploaded font sharing, and license review are not implemented.
- Messages and persistent communities are previews. Reporting, moderation queues, appeals, blocking, spam limits, profile deletion, and account recovery improvements remain to be built before a public launch.
- The current prototype uses public posts and a public media bucket. Do not upload sensitive or private material.

## File map

- index.html — app shell
- styles.css — Revenant UI styles
- app.js — onboarding, local demo behavior, and optional Supabase client integration
- config.js — blank backend settings for the owner to fill in
- supabase-schema.sql — database schema, grants, RLS policies, storage bucket and policies
