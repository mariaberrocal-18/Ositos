-- Simona y Amelia · esquema de la base de datos
-- Pegalo entero en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.

-- 1) Quién puede entrar ---------------------------------------------------------------
create table if not exists public.members (
  email text primary key,
  name  text
);

-- true si el email del usuario logueado está en members
create or replace function public.is_member()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 2) Ficha de cada gata -------------------------------------------------------------
create table if not exists public.pets (
  id          text primary key check (id in ('amelia','simona')),
  castrada    text,
  condiciones text,
  docs        jsonb not null default '[]'::jsonb,   -- [{path,name,type}] en el bucket "docs"
  updated_at  timestamptz not null default now()
);
insert into public.pets (id) values ('amelia'), ('simona') on conflict do nothing;

-- 3) Registros (visitas, vacunas, estudios, journal, etc.) ---------------------------------
create table if not exists public.records (
  id               text primary key default gen_random_uuid()::text,
  pet_id           text not null references public.pets(id),
  type             text not null check (type in ('sintoma','consulta','estudio','vacuna','desparasitacion','medicacion','peso')),
  date             text not null,                    -- 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM'
  data             jsonb not null default '{}'::jsonb, -- campos propios de cada tipo (title, nextDate, notes, kg…)
  files            jsonb not null default '[]'::jsonb,
  source           text,                              -- 'historia' si vino de la historia clínica
  created_by_email text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);
create index if not exists records_pet_date on public.records (pet_id, date desc);

-- 4) Seguridad: solo los miembros leen y escriben ---------------------------------------
alter table public.members enable row level security;
alter table public.pets    enable row level security;
alter table public.records enable row level security;

drop policy if exists "members read" on public.members;
create policy "members read" on public.members for select to authenticated using (public.is_member());

drop policy if exists "pets all" on public.pets;
create policy "pets all" on public.pets for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "records all" on public.records;
create policy "records all" on public.records for all to authenticated using (public.is_member()) with check (public.is_member());

-- 5) Archivos (PDFs y fotos) en un bucket privado --------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('docs', 'docs', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "docs read"   on storage.objects;
drop policy if exists "docs write"  on storage.objects;
drop policy if exists "docs update" on storage.objects;
drop policy if exists "docs delete" on storage.objects;
create policy "docs read"   on storage.objects for select to authenticated using (bucket_id = 'docs' and public.is_member());
create policy "docs write"  on storage.objects for insert to authenticated with check (bucket_id = 'docs' and public.is_member());
create policy "docs update" on storage.objects for update to authenticated using (bucket_id = 'docs' and public.is_member());
create policy "docs delete" on storage.objects for delete to authenticated using (bucket_id = 'docs' and public.is_member());

-- 6) Cambios en vivo entre los dos teléfonos ---------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.records; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.pets;    exception when duplicate_object then null; end;
end $$;

-- 7) Los miembros (los emails que pueden entrar) se cargan en seed-privado.sql,
--    que no se sube al repo. Para agregar a alguien más a mano:
--    insert into public.members (email, name) values ('alguien@email.com', 'Nombre');
