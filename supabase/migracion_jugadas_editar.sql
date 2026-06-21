-- ============================================================
-- MIGRACIÓN: Permitir editar jugadas épicas
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

create policy "Editar jugadas del grupo"
  on jugadas_epicas for update
  to authenticated
  using (
    partido_id in (select id from partidos where grupo_id = get_mi_grupo_id())
  );
