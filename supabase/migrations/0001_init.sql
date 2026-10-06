create type mod_status as enum ('draft', 'pending', 'published', 'rejected');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_-]{2,40}$'),
  display_name text,
  avatar_url text,
  github_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table categories (
  id serial primary key,
  slug text unique not null,
  name text not null,
  sort_order int not null default 0
);

insert into categories (slug, name, sort_order) values
  ('productivity', 'Productivity', 1),
  ('monitoring', 'Monitoring', 2),
  ('safety', 'Safety', 3),
  ('fun-games', 'Fun & games', 4),
  ('git-ci', 'Git & CI', 5),
  ('context-tokens', 'Context & tokens', 6),
  ('ui-themes', 'UI & themes', 7),
  ('workflow', 'Workflow', 8);

create table mods (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  author_id uuid not null references profiles on delete cascade,
  title text not null,
  tagline text not null,
  description_md text not null default '',
  prompt_md text not null,
  category_id int references categories,
  surfaces text[] not null,
  reaches text[] not null,
  preview_url text,
  poster_url text,
  media_type text check (media_type in ('video', 'gif', 'image')),
  repo_url text,
  install_cmd text,
  min_cc_version text,
  status mod_status not null default 'pending',
  review_note text,
  is_featured boolean not null default false,
  is_premium boolean not null default false,
  copy_count int not null default 0,
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  fts tsvector generated always as
    (to_tsvector('english', title || ' ' || tagline || ' ' || description_md)) stored
);
create index mods_status_published_idx on mods (status, published_at desc);
create index mods_surfaces_idx on mods using gin (surfaces);
create index mods_fts_idx on mods using gin (fts);
create index mods_author_idx on mods (author_id);

create table likes (
  user_id uuid not null references profiles on delete cascade,
  mod_id uuid not null references mods on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, mod_id)
);

create table copy_events (
  id bigserial primary key,
  mod_id uuid not null references mods on delete cascade,
  user_id uuid,
  kind text not null check (kind in ('copy', 'download')),
  created_at timestamptz not null default now()
);

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table mods enable row level security;
alter table likes enable row level security;
alter table copy_events enable row level security;

create policy "profiles readable" on profiles for select using (true);
create policy "own profile" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy "categories readable" on categories for select using (true);

create policy "published or own or admin" on mods for select
  using (status = 'published' or author_id = auth.uid() or is_admin());
create policy "author inserts" on mods for insert
  with check (author_id = auth.uid() and status in ('draft', 'pending') and not is_featured and not is_premium
    and copy_count = 0 and like_count = 0);
create policy "author edits unpublished" on mods for update
  using (author_id = auth.uid() and status <> 'published')
  with check (author_id = auth.uid() and status in ('draft', 'pending') and not is_featured and not is_premium);
create policy "author deletes own" on mods for delete using (author_id = auth.uid());
create policy "admin all" on mods for all using (is_admin()) with check (is_admin());

create policy "likes readable" on likes for select using (true);
create policy "own like" on likes for insert with check (user_id = auth.uid());
create policy "own unlike" on likes for delete using (user_id = auth.uid());
-- copy_events: no policies, written only through track_copy()

-- Authors can't touch counters or moderation fields through updates.
create function protect_mod_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_admin()
     and coalesce(current_setting('app.counter_write', true), '') <> 'on' then
    new.copy_count := old.copy_count;
    new.like_count := old.like_count;
    new.review_note := old.review_note;
    new.published_at := old.published_at;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger mods_protect before update on mods for each row execute function protect_mod_fields();

create function track_copy(p_mod uuid, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('copy', 'download') then
    raise exception 'bad kind';
  end if;
  if not exists (select 1 from mods where id = p_mod and status = 'published') then
    return;
  end if;
  insert into copy_events (mod_id, user_id, kind) values (p_mod, auth.uid(), p_kind);
  perform set_config('app.counter_write', 'on', true);
  update mods set copy_count = copy_count + 1 where id = p_mod;
end $$;
grant execute on function track_copy(uuid, text) to anon, authenticated;

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base text;
begin
  base := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1), 'user'),
    '[^a-zA-Z0-9_-]', '', 'g'));
  if length(base) < 2 then base := 'user'; end if;
  insert into profiles (id, handle, display_name, avatar_url, github_url)
  values (
    new.id,
    left(base, 30) || '-' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ->> 'user_name' is not null
      then 'https://github.com/' || (new.raw_user_meta_data ->> 'user_name') end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create function sync_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m uuid := coalesce(new.mod_id, old.mod_id);
begin
  perform set_config('app.counter_write', 'on', true);
  update mods set like_count = (select count(*) from likes where mod_id = m) where id = m;
  return null;
end $$;
create trigger likes_count after insert or delete on likes
  for each row execute function sync_like_count();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('previews', 'previews', true, 26214400,
  array['video/mp4', 'video/webm', 'image/gif', 'image/png', 'image/jpeg', 'image/webp']);

create policy "upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text);
