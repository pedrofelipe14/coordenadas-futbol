-- ============================================================
-- MIGRACIÓN: URL en jugadas épicas
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

alter table jugadas_epicas
  add column if not exists url text;
