-- Revenant / Forgeware 0.03 — Supabase schema
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
  on public.profiles for insert to authenticated with check ((select auth.uid()) = id and terms_version = 'revenant-community-rules-0.03' and terms_accepted_at is not null);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id and terms_version = 'revenant-community-rules-0.03' and terms_accepted_at is not null);

drop policy if exists "Posts are publicly readable" on public.posts;
create policy "Posts are publicly readable"
  on public.posts for select to anon, authenticated using (true);
drop policy if exists "Signed-in users create their own posts" on public.posts;
create policy "Signed-in users create their own posts"
  on public.posts for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.03' and p.terms_accepted_at is not null));
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
  on public.comments for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.03' and p.terms_accepted_at is not null));
drop policy if exists "Authors can delete their own comments" on public.comments;
create policy "Authors can delete their own comments"
  on public.comments for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Likes are publicly readable" on public.post_likes;
create policy "Likes are publicly readable"
  on public.post_likes for select to anon, authenticated using (true);
drop policy if exists "Users can like as themselves" on public.post_likes;
create policy "Users can like as themselves"
  on public.post_likes for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.03' and p.terms_accepted_at is not null));
drop policy if exists "Users can remove their own likes" on public.post_likes;
create policy "Users can remove their own likes"
  on public.post_likes for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own bookmarks" on public.bookmarks;
create policy "Users can view their own bookmarks"
  on public.bookmarks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own bookmarks" on public.bookmarks;
create policy "Users can create their own bookmarks"
  on public.bookmarks for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.terms_version = 'revenant-community-rules-0.03' and p.terms_accepted_at is not null));
drop policy if exists "Users can delete their own bookmarks" on public.bookmarks;
create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete to authenticated using ((select auth.uid()) = user_id);


-- Forgeware 0.03 additions: post types and polls.
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
        and pr.terms_version = 'revenant-community-rules-0.03'
        and pr.terms_accepted_at is not null
    )
    and exists (
      select 1 from public.posts po
      where po.id = post_id
        and po.post_type = 'poll'
        and jsonb_typeof(po.poll_data->'options') = 'array'
        and option_index >= 0
        and option_index < jsonb_array_length(po.poll_data->'options')
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
        and pr.terms_version = 'revenant-community-rules-0.03'
        and pr.terms_accepted_at is not null
    )
    and (
      (post_type = 'post' and poll_data is null)
      or
      (post_type = 'poll'
       and jsonb_typeof(poll_data->'options') = 'array'
       and jsonb_array_length(poll_data->'options') between 2 and 4)
    )
  );

-- Public media bucket for media attached to public posts. Only the owner may upload,
-- replace, or delete objects, and every upload must start with the user's auth UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', true, 8000000,
        array['image/png','image/jpeg','image/gif','image/webp','image/avif'])
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

commit;
