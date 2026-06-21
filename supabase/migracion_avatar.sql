-- ============================================================
-- MIGRACIÓN: Avatar de jugador
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Columna avatar_url en profiles
alter table profiles
  add column if not exists avatar_url text;

-- 2. Bucket de avatares públicos
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Políticas de storage
create policy "Avatares visibles para todos"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Subir avatar propio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "Actualizar avatar propio"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');
