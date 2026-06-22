-- ============================================================
-- MIGRACIÓN: Rol de dev (nombre dorado)
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

alter table profiles
  add column if not exists es_dev boolean not null default false;

-- Activar en tu usuario (reemplazá el email):
-- UPDATE profiles SET es_dev = true
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');
