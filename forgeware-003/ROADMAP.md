# Revenant — Forgeware Roadmap

This roadmap separates the current prototype from features that still need production engineering. “Implemented” means present in Forgeware 0.03's prototype; it does not imply a production-ready service.

## Forgeware 0.03 — implemented prototype

- Responsive black/red navigation and command bar
- Home, Feed, Posts, Reels placeholders, Explore, Saved, Notifications, Drafts, Communities, Messages preview, Profile, Settings, and Terms
- Age declaration and versioned Terms gate with the “Burch” redirect joke
- Local demo accounts, demo credential screen, and browser storage
- Local posts, likes, replies, reposts, bookmarks, GIF/image attachments, text styles, polls, voting, drafts, and sample notifications
- Optional Supabase flow for shared profiles/posts/comments/likes/bookmarks/media and aggregate poll votes when the SQL schema is installed
- Browser-session font loading for TTF/OTF/WOFF/WOFF2

## Forgeware 0.04 — next useful milestone

- Finish backend integration for user follows and a real Following feed
- Connect notifications to server events
- Community membership and server-side community records
- Better profile editing, public bios, avatar uploads, and account recovery
- Tests for auth, Terms acceptance, database policies, and social actions
- Error/loading states and improved mobile usability

## Future milestone — media and communication

- Real video upload, transcoding, adaptive streaming, thumbnails, captions, and storage lifecycle management
- Direct messaging and group chats with real-time delivery, attachments, moderation controls, and private access policies
- Live streaming, voice rooms, video calls, presence, typing indicators, and read receipts
- Reels feed driven by actual media and creator controls

## Future milestone — creators and customization

- Animated avatar/profile-picture builder and free profile decorations
- Font ZIP archive inspection, conversion jobs, font hosting, font-license checks, and cache controls
- More custom text effects, GIF search provider, sticker packs, and community emoji
- Creator analytics, scheduled publishing, livestream dashboards, and optional monetization

## Future milestone — platform reliability and safety

- Dedicated reporting/moderation queues, appeals, block/mute controls, admin audit trails, rate limits, spam/scam prevention, and content policies
- Robust age-assurance and child-safety approach for launch regions
- Complete legal Terms of Service and Privacy Policy, deletion/retention workflows, accessibility review, security testing, load testing, monitoring, backups, and recovery
- Mobile applications, search indexing, reliable recommendation controls, and useful trends backed by actual metrics
