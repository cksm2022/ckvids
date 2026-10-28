-- Revenant / Forgeware 0.05 — Supabase schema
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- Use only the project's publishable key in the browser. Never expose service_role/secret keys.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(btrim(username)) between 2 and 24),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 280),
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null constraint posts_user_id_fkey references public.profiles(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  category text not null default 'GENERAL'
    check (category in ('GENERAL','GAMING','ART & DESIGN','TECH','DISCUSSION','MEMES')),
  font_family text not null default 'standard'
    check (font_family in ('standard','pixel','mono','serif','hand','imported')),
  media_url text,
  created_at timestamptz not null default now(),
  constraint posts_body_or_media check (char_length(btrim(body)) > 0 or media_url is not null)
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null constraint comments_post_id_fkey references public.posts(id) on delete cascade,
  user_id uuid not null constraint comments_user_id_fkey references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  font_family text not null default 'standard'
    check (font_family in ('standard','pixel','mono','serif','hand','imported')),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at);

create table if not exists public.post_likes (
  post_id uuid not null constraint post_likes_post_id_fkey references public.posts(id) on delete cascade,
  user_id uuid not null constraint post_likes_user_id_fkey references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.bookmarks (
  post_id uuid not null constraint bookmarks_post_id_fkey references public.posts(id) on delete cascade,
  user_id uuid not null constraint bookmarks_user_id_fkey references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.bookmarks enable row level security;

-- Explicit minimum table grants. RLS policies below enforce row-level access.
revoke all on public.profiles, public.posts, public.comments, public.post_likes, public.bookmarks from anon, authenticated;
grant select on public.profiles, public.posts, public.comments, public.post_likes to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.posts to authenticated;
grant insert, delete on public.comments to authenticated;
grant insert, delete on public.post_likes to authenticated;
grant select, insert, delete on public.bookmarks to authenticated;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select to anon, authenticated using (true);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated with check ((select auth.uid()) = id and terms_version = 'revenant-community-rules-0.05' and terms_accepted_at is not null);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id and terms_version = 'revenant-community-rules-0.05' and terms_accepted_at is not null);

drop policy if exists "Posts are publicly readable" on public.posts;
create policy "Posts are publicly readable"
  on public.posts for select to anon, authenticated using (true);
drop policy if exists "Signed-in users create their own posts" on public.posts;
create policy "Signed-in users create their own posts"
  on public.posts for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.05' and p.terms_accepted_at is not null));
drop policy if exists "Authors can update their own posts" on public.posts;
create policy "Authors can update their own posts"
  on public.posts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Authors can delete their own posts" on public.posts;
create policy "Authors can delete their own posts"
  on public.posts for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Comments are publicly readable" on public.comments;
create policy "Comments are publicly readable"
  on public.comments for select to anon, authenticated using (true);
drop policy if exists "Signed-in users create their own comments" on public.comments;
create policy "Signed-in users create their own comments"
  on public.comments for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.05' and p.terms_accepted_at is not null));
drop policy if exists "Authors can delete their own comments" on public.comments;
create policy "Authors can delete their own comments"
  on public.comments for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Likes are publicly readable" on public.post_likes;
create policy "Likes are publicly readable"
  on public.post_likes for select to anon, authenticated using (true);
drop policy if exists "Users can like as themselves" on public.post_likes;
create policy "Users can like as themselves"
  on public.post_likes for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.05' and p.terms_accepted_at is not null));
drop policy if exists "Users can remove their own likes" on public.post_likes;
create policy "Users can remove their own likes"
  on public.post_likes for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own bookmarks" on public.bookmarks;
create policy "Users can view their own bookmarks"
  on public.bookmarks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own bookmarks" on public.bookmarks;
create policy "Users can create their own bookmarks"
  on public.bookmarks for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.05' and p.terms_accepted_at is not null));
drop policy if exists "Users can delete their own bookmarks" on public.bookmarks;
create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete to authenticated using ((select auth.uid()) = user_id);


-- Forgeware 0.05 additions: post types and polls.
alter table public.posts add column if not exists post_type text not null default 'post';
alter table public.posts add column if not exists poll_data jsonb;
do $
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_post_type_check') then
    alter table public.posts add constraint posts_post_type_check check (post_type in ('post','poll'));
  end if;
end $;

create table if not exists public.poll_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_index integer not null check (option_index between 0 and 3),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.poll_votes enable row level security;
revoke all on public.poll_votes from anon, authenticated;
grant select, insert, delete on public.poll_votes to authenticated;
drop policy if exists "Users can view their own poll vote" on public.poll_votes;
create policy "Users can view their own poll vote"
  on public.poll_votes for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can vote once on valid polls" on public.poll_votes;
create policy "Users can vote once on valid polls"
  on public.poll_votes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.terms_version = 'revenant-community-rules-0.05'
        and pr.terms_accepted_at is not null
    )
    and exists (
      select 1 from public.posts po
      where po.id = post_id
        and po.post_type = 'poll'
        and jsonb_typeof(po.poll_data->'options') = 'array'
        and option_index >= 0
        and case when jsonb_typeof(po.poll_data->'options') = 'array' then option_index < jsonb_array_length(po.poll_data->'options') else false end
    )
  );
drop policy if exists "Users can remove their own poll vote" on public.poll_votes;
create policy "Users can remove their own poll vote"
  on public.poll_votes for delete to authenticated using ((select auth.uid()) = user_id);

-- Return aggregate counts without exposing the list of voters to every reader.
create or replace function public.get_poll_results(post_ids uuid[])
returns table(post_id uuid, option_index integer, vote_count bigint, viewer_option integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $
  select p.id,
         (o.ordinality - 1)::integer as option_index,
         count(v.user_id) as vote_count,
         max(case when v.user_id = auth.uid() then v.option_index else null end)::integer as viewer_option
  from public.posts p
  cross join lateral jsonb_array_elements_text(p.poll_data->'options')
       with ordinality as o(option_text, ordinality)
  left join public.poll_votes v
    on v.post_id = p.id and v.option_index = (o.ordinality - 1)::integer
  where p.id = any(post_ids) and p.post_type = 'poll'
  group by p.id, o.ordinality
$;
revoke all on function public.get_poll_results(uuid[]) from public;
grant execute on function public.get_poll_results(uuid[]) to anon, authenticated;

-- Recreate the insert policy to validate poll payloads as well as Terms acceptance.
drop policy if exists "Signed-in users create their own posts" on public.posts;
create policy "Signed-in users create their own posts"
  on public.posts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.terms_version = 'revenant-community-rules-0.05'
        and pr.terms_accepted_at is not null
    )
    and (
      (post_type = 'post' and poll_data is null)
      or
      (post_type = 'poll'
       and jsonb_typeof(poll_data->'options') = 'array'
       and case when jsonb_typeof(poll_data->'options') = 'array' then jsonb_array_length(poll_data->'options') between 2 and 4 else false end)
    )
  );


-- Follow graph. Reads are limited to the signed-in user's own following list.
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);
alter table public.follows enable row level security;
revoke all on public.follows from anon, authenticated;
grant select, insert, delete on public.follows to authenticated;
drop policy if exists "Users can view their own following list" on public.follows;
create policy "Users can view their own following list"
  on public.follows for select to authenticated using ((select auth.uid()) = follower_id);
drop policy if exists "Users can follow accounts as themselves" on public.follows;
create policy "Users can follow accounts as themselves"
  on public.follows for insert to authenticated
  with check (
    (select auth.uid()) = follower_id
    and follower_id <> following_id
    and exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.terms_version = 'revenant-community-rules-0.05'
        and pr.terms_accepted_at is not null
    )
  );
drop policy if exists "Users can unfollow accounts as themselves" on public.follows;
create policy "Users can unfollow accounts as themselves"
  on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

-- Public media bucket for media attached to public posts. Only the owner may upload,
-- replace, or delete objects, and every upload must start with the user's auth UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', true, 50000000,
        array['image/png','image/jpeg','image/gif','image/webp','image/avif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Post media is publicly readable" on storage.objects;
create policy "Post media is publicly readable"
  on storage.objects for select to anon, authenticated using (bucket_id = 'post-media');
drop policy if exists "Users upload into their own post-media folder" on storage.objects;
create policy "Users upload into their own post-media folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users update their own post-media files" on storage.objects;
create policy "Users update their own post-media files"
  on storage.objects for update to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users delete their own post-media files" on storage.objects;
create policy "Users delete their own post-media files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Forgeware 0.05 safety controls.
create table if not exists public.account_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint account_blocks_no_self check (blocker_id <> blocked_id)
);
create index if not exists account_blocks_blocked_idx on public.account_blocks (blocked_id);

create table if not exists public.account_mutes (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  muted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, muted_id),
  constraint account_mutes_no_self check (blocker_id <> muted_id)
);
create index if not exists account_mutes_muted_idx on public.account_mutes (muted_id);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  reason text not null check (reason in (
    'Spam or scams',
    'Harassment or bullying',
    'Hate or credible threats',
    'Privacy or doxxing',
    'Sexual exploitation',
    'Illegal or dangerous activity',
    'Other'
  )),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'received' check (status in ('received','reviewing','actioned','dismissed')),
  created_at timestamptz not null default now(),
  constraint content_reports_target_required check (target_user_id is not null or post_id is not null)
);
create index if not exists content_reports_reporter_created_idx
  on public.content_reports (reporter_id, created_at desc);

alter table public.account_blocks enable row level security;
alter table public.account_mutes enable row level security;
alter table public.content_reports enable row level security;

revoke all on public.account_blocks, public.account_mutes, public.content_reports from anon, authenticated;
grant select, insert, delete on public.account_blocks, public.account_mutes to authenticated;
grant select, insert on public.content_reports to authenticated;

drop policy if exists account_blocks_select_own on public.account_blocks;
create policy account_blocks_select_own on public.account_blocks
  for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists account_blocks_insert_own on public.account_blocks;
create policy account_blocks_insert_own on public.account_blocks
  for insert to authenticated with check (auth.uid() = blocker_id and blocker_id <> blocked_id);
drop policy if exists account_blocks_delete_own on public.account_blocks;
create policy account_blocks_delete_own on public.account_blocks
  for delete to authenticated using (auth.uid() = blocker_id);

drop policy if exists account_mutes_select_own on public.account_mutes;
create policy account_mutes_select_own on public.account_mutes
  for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists account_mutes_insert_own on public.account_mutes;
create policy account_mutes_insert_own on public.account_mutes
  for insert to authenticated with check (auth.uid() = blocker_id and blocker_id <> muted_id);
drop policy if exists account_mutes_delete_own on public.account_mutes;
create policy account_mutes_delete_own on public.account_mutes
  for delete to authenticated using (auth.uid() = blocker_id);

drop policy if exists content_reports_select_own on public.content_reports;
create policy content_reports_select_own on public.content_reports
  for select to authenticated using (auth.uid() = reporter_id);
drop policy if exists content_reports_insert_own on public.content_reports;
create policy content_reports_insert_own on public.content_reports
  for insert to authenticated with check (auth.uid() = reporter_id);


-- Forgeware 0.05: shared communities, private direct messages and notifications.
create table if not exists public.communities (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(btrim(name)) between 2 and 40),
 slug text not null unique check(char_length(slug) between 3 and 60), description text not null default '' check(char_length(description)<=240),
 category text not null default 'General' check(char_length(category)<=30), created_by uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index if not exists communities_name_search_idx on public.communities(lower(name));
create table if not exists public.community_members (
 community_id uuid not null references public.communities(id) on delete cascade,
 member_id uuid not null references public.profiles(id) on delete cascade,
 role text not null default 'member' check(role in ('owner','moderator','member')),
 created_at timestamptz not null default now(), primary key(community_id,member_id)
);
create index if not exists community_members_member_idx on public.community_members(member_id);
alter table public.posts add column if not exists media_type text;
alter table public.posts add column if not exists community_id uuid references public.communities(id) on delete set null;
create index if not exists posts_community_created_idx on public.posts(community_id,created_at desc);
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
revoke all on public.communities,public.community_members from anon,authenticated;
grant select on public.communities to anon,authenticated;
grant select on public.community_members to authenticated;
grant insert,update,delete on public.communities to authenticated;
grant insert,delete on public.community_members to authenticated;
drop policy if exists communities_public_read on public.communities;
create policy communities_public_read on public.communities for select to anon,authenticated using(true);
drop policy if exists communities_create_as_self on public.communities;
create policy communities_create_as_self on public.communities for insert to authenticated with check(created_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.terms_version='revenant-community-rules-0.05' and p.terms_accepted_at is not null));
drop policy if exists communities_update_owner on public.communities;
create policy communities_update_owner on public.communities for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
drop policy if exists communities_delete_owner on public.communities;
create policy communities_delete_owner on public.communities for delete to authenticated using(created_by=auth.uid());
drop policy if exists community_members_authenticated_read on public.community_members;
create policy community_members_authenticated_read on public.community_members for select to authenticated using(true);
drop policy if exists community_members_join_self on public.community_members;
create policy community_members_join_self on public.community_members for insert to authenticated with check(member_id=auth.uid() and role='member' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.terms_version='revenant-community-rules-0.05' and p.terms_accepted_at is not null));
drop policy if exists community_members_leave_self on public.community_members;
create policy community_members_leave_self on public.community_members for delete to authenticated using(member_id=auth.uid() and role<>'owner');
create or replace function public.add_community_owner_membership()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin insert into public.community_members(community_id,member_id,role) values(new.id,new.created_by,'owner') on conflict do nothing;return new;end $$;
drop trigger if exists communities_add_owner on public.communities;
create trigger communities_add_owner after insert on public.communities for each row execute function public.add_community_owner_membership();

drop policy if exists "Signed-in users create their own posts" on public.posts;
create policy "Signed-in users create their own posts" on public.posts for insert to authenticated with check(
 user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.terms_version='revenant-community-rules-0.05' and p.terms_accepted_at is not null)
 and (community_id is null or exists(select 1 from public.community_members cm where cm.community_id=posts.community_id and cm.member_id=auth.uid()))
 and ((post_type='post' and poll_data is null) or (post_type='poll' and jsonb_typeof(poll_data->'options')='array' and case when jsonb_typeof(poll_data->'options')='array' then jsonb_array_length(poll_data->'options') between 2 and 4 else false end))
);
drop policy if exists "Authors can update their own posts" on public.posts;
create policy "Authors can update their own posts" on public.posts for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id and (community_id is null or exists(select 1 from public.community_members cm where cm.community_id=posts.community_id and cm.member_id=auth.uid())));

create table if not exists public.direct_messages (
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade, body text not null check(char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now(), read_at timestamptz, constraint direct_messages_no_self check(sender_id<>recipient_id)
);
create index if not exists direct_messages_sender_created_idx on public.direct_messages(sender_id,created_at desc);
create index if not exists direct_messages_recipient_created_idx on public.direct_messages(recipient_id,created_at desc);
alter table public.direct_messages enable row level security;
revoke all on public.direct_messages from anon,authenticated;
grant select,insert on public.direct_messages to authenticated;
grant update(read_at) on public.direct_messages to authenticated;
drop policy if exists direct_messages_select_participant on public.direct_messages;
create policy direct_messages_select_participant on public.direct_messages for select to authenticated using(auth.uid()=sender_id or auth.uid()=recipient_id);
drop policy if exists direct_messages_insert_sender on public.direct_messages;
create policy direct_messages_insert_sender on public.direct_messages for insert to authenticated with check(auth.uid()=sender_id and sender_id<>recipient_id and exists(select 1 from public.profiles p where p.id=auth.uid() and p.terms_version='revenant-community-rules-0.05' and p.terms_accepted_at is not null) and exists(select 1 from public.profiles target where target.id=recipient_id));
drop policy if exists direct_messages_recipient_read_receipt on public.direct_messages;
create policy direct_messages_recipient_read_receipt on public.direct_messages for update to authenticated using(auth.uid()=recipient_id) with check(auth.uid()=recipient_id);

create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
 actor_id uuid references public.profiles(id) on delete set null, event_type text not null check(event_type in ('like','comment','follow','message','community')),
 entity_id uuid, body text not null default '' check(char_length(body)<=300), read_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id,created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon,authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
drop policy if exists notifications_select_recipient on public.notifications;
create policy notifications_select_recipient on public.notifications for select to authenticated using(auth.uid()=recipient_id);
drop policy if exists notifications_update_recipient on public.notifications;
create policy notifications_update_recipient on public.notifications for update to authenticated using(auth.uid()=recipient_id) with check(auth.uid()=recipient_id);

create or replace function public.revenant_notify_user(p_recipient uuid,p_actor uuid,p_type text,p_entity uuid,p_body text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin if p_recipient is not null and p_actor is not null and p_recipient<>p_actor then insert into public.notifications(recipient_id,actor_id,event_type,entity_id,body) values(p_recipient,p_actor,p_type,p_entity,left(coalesce(p_body,''),300));end if;end $$;
revoke all on function public.revenant_notify_user(uuid,uuid,text,uuid,text) from public,anon,authenticated;
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin perform public.revenant_notify_user(new.recipient_id,new.sender_id,'message',new.id,'Sent you a private message.');return new;end $$;
drop trigger if exists direct_messages_notify on public.direct_messages;
create trigger direct_messages_notify after insert on public.direct_messages for each row execute function public.notify_new_message();
create or replace function public.notify_new_comment()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid;
begin select user_id into owner_id from public.posts where id=new.post_id;perform public.revenant_notify_user(owner_id,new.user_id,'comment',new.post_id,'Replied to your post.');return new;end $$;
drop trigger if exists comments_notify on public.comments;
create trigger comments_notify after insert on public.comments for each row execute function public.notify_new_comment();
create or replace function public.notify_new_like()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid;
begin select user_id into owner_id from public.posts where id=new.post_id;perform public.revenant_notify_user(owner_id,new.user_id,'like',new.post_id,'Liked your post.');return new;end $$;
drop trigger if exists post_likes_notify on public.post_likes;
create trigger post_likes_notify after insert on public.post_likes for each row execute function public.notify_new_like();
create or replace function public.notify_new_follow()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin perform public.revenant_notify_user(new.following_id,new.follower_id,'follow',new.follower_id,'Started following you.');return new;end $$;
drop trigger if exists follows_notify on public.follows;
create trigger follows_notify after insert on public.follows for each row execute function public.notify_new_follow();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('post-media','post-media',true,50000000,array['image/png','image/jpeg','image/gif','image/webp','image/avif','video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='direct_messages') then execute 'alter publication supabase_realtime add table public.direct_messages';end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then execute 'alter publication supabase_realtime add table public.notifications';end if;
 end if;
end $$;

commit;
