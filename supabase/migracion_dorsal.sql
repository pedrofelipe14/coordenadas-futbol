-- ============================================================
-- MIGRACIÓN: Ampliar dorsal hasta 3 dígitos (máx 999)
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

alter table profiles
  drop constraint if exists profiles_dorsal_check;

alter table profiles
  add constraint profiles_dorsal_check check (dorsal between 1 and 999);
