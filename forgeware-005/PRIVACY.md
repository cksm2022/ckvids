# Revenant Privacy Notice - Draft for Review

Status: Technical draft for Forgeware 0.05. This is not legal advice and is not a complete jurisdiction-specific privacy policy. The operator must complete the responsible entity, contact information, launch region, retention durations and rights request process before inviting the public.

## Local demo mode
The front end may save the demo profile, local posts, drafts, bookmarks, notification examples, community previews, theme settings and demo safety controls in this browser. Local demo information does not automatically sync across devices. Clearing site data may remove it.

## Cloud features
The configured Supabase project can process account identity and email through Supabase Auth; username, avatar URL and bio; public posts and attachments; comments, likes, follows and bookmarks; direct messages; community memberships and posts; uploaded media; and notification/read state. The service operator controls the configured project and its retention settings.

## Public content, direct messages and media
Posts are intended to be public. Post media is stored in a public storage bucket under this schema, so anyone with its public URL may retrieve it. Do not upload private media. Direct messages are designed to be visible to the two participants and are restricted by database row-level security, but are not end-to-end encrypted.

## Providers and transfers
The interface loads Supabase's JavaScript library from a public CDN and can send cloud feature data to the configured Supabase instance. The operator must review provider terms, data processing terms, locations and privacy documentation, and list any additional providers before launch.

## Retention, access, deletion and contact
The prototype does not yet provide a complete automated account-deletion workflow that removes every related record and storage object, nor a complete self-service export of all cloud data. Before launch, the operator must define retention periods, backups and purge behavior; provide a data rights request process; name the responsible service entity and contact; and explain applicable legal rights.

## Security and child safety
Use only the Supabase browser publishable key in config.js; never embed a service-role secret. Confirm row-level policies and Storage rules against separate test accounts. The birthday screen is self-declaration, not age verification. The operator must implement and document age-safety, moderation, appeals and incident handling.

## Changes
This draft should be versioned and published at the live service URL. The operator should explain when material changes take effect and how users will be informed.
