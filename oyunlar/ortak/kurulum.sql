-- Baykuş sıralama tablosu (Supabase > SQL Editor içine yapıştırıp Run de)
create table if not exists public.skorlar (
  id     bigint generated always as identity primary key,
  oyun   text not null check (char_length(oyun) between 1 and 20),
  ad     text not null check (char_length(ad) between 1 and 16),
  puan   integer not null check (puan between 0 and 2000000000),
  sezon  text not null default '1' check (char_length(sezon) between 1 and 10),
  tarih  timestamptz not null default now()
);
create index if not exists skorlar_sirala on public.skorlar (oyun, sezon, puan desc);

alter table public.skorlar enable row level security;
drop policy if exists "herkes okur" on public.skorlar;
drop policy if exists "herkes ekler" on public.skorlar;
create policy "herkes okur"  on public.skorlar for select to anon, authenticated using (true);
create policy "herkes ekler" on public.skorlar for insert to anon, authenticated with check (true);
grant select, insert on public.skorlar to anon, authenticated;
