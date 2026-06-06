-- RushHour schema — run this once in the Supabase SQL editor.
-- No login: tables are written/read only server-side via the service_role key,
-- so RLS stays off for the demo.

create extension if not exists "pgcrypto";

create table if not exists businesses (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  category        text,
  city            text,
  neighborhood    text,
  style_tags      text[] not null default '{}',
  description     text,
  profile_summary text,
  source_url      text,
  created_at      timestamptz not null default now()
);

create table if not exists creators (
  id              text primary key default gen_random_uuid()::text,
  handle          text not null,
  platform        text not null default 'instagram',
  followers       integer not null default 0,
  avatar_url      text,
  cover_url       text,
  topics          text[] not null default '{}',
  style_tags      text[] not null default '{}',
  audience_city   text,
  engagement_rate real not null default 0,
  local_share     real not null default 0,
  engagement      real not null default 0,
  reach           real not null default 0,
  profile_summary text,
  source_url      text,
  created_at      timestamptz not null default now()
);

-- Avoid duplicate creators when the same handle is extracted twice.
-- Plain unique column so PostgREST upsert(on_conflict=handle) works.
create unique index if not exists creators_handle_key on creators (handle);

-- Seed the four demo creators so matching works immediately and the
-- "Moneyball" flip (lisa vs. foodie_germany) is reproducible.
insert into creators
  (id, handle, platform, followers, avatar_url, cover_url, topics, style_tags, audience_city, engagement_rate, local_share, engagement, reach, profile_summary)
values
  ('cr_lisa', '@lisa_hamburg_eats', 'instagram', 8400,
   'https://i.pravatar.cc/150?img=47',
   'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80&auto=format&fit=crop',
   '{food,local,lifestyle}', '{warm,authentisch,cozy}', 'Hamburg', 0.082, 0.71, 0.9, 0.25,
   'Kleine, hyperlokale Hamburger Food-Creatorin mit sehr engagierter Community.'),
  ('cr_foodie_de', '@foodie_germany', 'instagram', 210000,
   'https://i.pravatar.cc/150?img=12',
   'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop',
   '{food,travel,restaurants}', '{clean,modern,glossy}', 'Berlin', 0.018, 0.08, 0.4, 0.95,
   'Reichweitenstarker bundesweiter Food-Account, breite aber wenig lokale Zielgruppe.'),
  ('cr_max', '@max_hh_lifestyle', 'tiktok', 32000,
   'https://i.pravatar.cc/150?img=33',
   'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80&auto=format&fit=crop',
   '{lifestyle,city,food}', '{modern,energetisch,urban}', 'Hamburg', 0.054, 0.55, 0.7, 0.55,
   'Hamburger Lifestyle-TikToker, solide lokale Reichweite und gutes Engagement.'),
  ('cr_pasta_queen', '@pasta.queen', 'instagram', 95000,
   'https://i.pravatar.cc/150?img=20',
   'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80&auto=format&fit=crop',
   '{food,recipes,italian}', '{warm,rustikal,authentisch}', 'München', 0.031, 0.12, 0.55, 0.8,
   'Italienische Rezept-Creatorin mit großer Reichweite, Zielgruppe vor allem in München.')
on conflict (id) do nothing;
