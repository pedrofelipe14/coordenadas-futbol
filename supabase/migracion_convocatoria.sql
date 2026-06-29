-- ============================================================
-- MIGRACIÓN: Sistema de convocatoria semanal
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Tabla principal: una por grupo, puede estar abierta o cerrada
CREATE TABLE IF NOT EXISTS public.convocatorias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id    uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  estado      text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  creado_por  uuid REFERENCES public.profiles(id),
  created_at  timestamptz DEFAULT now(),
  cerrada_at  timestamptz
);

ALTER TABLE public.convocatorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver convocatoria del grupo" ON public.convocatorias
  FOR SELECT USING (grupo_id = get_mi_grupo_id());

CREATE POLICY "admin crea convocatoria" ON public.convocatorias
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND es_admin = true)
    AND grupo_id = get_mi_grupo_id()
  );

CREATE POLICY "admin actualiza convocatoria" ON public.convocatorias
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND es_admin = true)
    AND grupo_id = get_mi_grupo_id()
  );

-- Votos individuales
CREATE TABLE IF NOT EXISTS public.convocatoria_votos (
  convocatoria_id uuid NOT NULL REFERENCES public.convocatorias(id) ON DELETE CASCADE,
  jugador_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  PRIMARY KEY (convocatoria_id, jugador_id)
);

ALTER TABLE public.convocatoria_votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver votos del grupo" ON public.convocatoria_votos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.convocatorias c
      WHERE c.id = convocatoria_id AND c.grupo_id = get_mi_grupo_id()
    )
  );

CREATE POLICY "votar en convocatoria abierta" ON public.convocatoria_votos
  FOR INSERT WITH CHECK (
    jugador_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.convocatorias c
      WHERE c.id = convocatoria_id
        AND c.estado = 'abierta'
        AND c.grupo_id = get_mi_grupo_id()
    )
  );

CREATE POLICY "retirar propio voto" ON public.convocatoria_votos
  FOR DELETE USING (jugador_id = auth.uid());
