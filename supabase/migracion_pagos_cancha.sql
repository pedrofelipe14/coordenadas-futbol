-- ============================================================
-- Pagos de cancha: divisón automática y tracking por jugador
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de pagos
CREATE TABLE IF NOT EXISTS public.pagos_cancha (
  partido_id uuid NOT NULL,
  jugador_id uuid NOT NULL,
  monto      numeric(10,2) NOT NULL,
  pagado     boolean NOT NULL DEFAULT false,
  pagado_at  timestamptz,
  PRIMARY KEY (partido_id, jugador_id),
  CONSTRAINT fk_pago_partido FOREIGN KEY (partido_id)
    REFERENCES public.partidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pago_jugador FOREIGN KEY (jugador_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.pagos_cancha ENABLE ROW LEVEL SECURITY;

-- Miembros del grupo ven los pagos de los partidos de su grupo
CREATE POLICY "ver pagos del grupo" ON public.pagos_cancha
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partidos p
      WHERE p.id = partido_id
        AND p.grupo_id = get_mi_grupo_id()
    )
  );

-- Cada jugador puede marcar su propio pago
CREATE POLICY "actualizar propio pago" ON public.pagos_cancha
  FOR UPDATE USING (jugador_id = auth.uid());

-- 2. RPC para crear los pagos al arrancar el partido
--    Se llama desde el cliente después de insertar el lineup
CREATE OR REPLACE FUNCTION public.crear_pagos_partido(p_partido_id uuid, p_costo numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer;
  v_monto numeric(10,2);
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.partido_jugadores
  WHERE partido_id = p_partido_id;

  IF v_count = 0 OR p_costo <= 0 THEN RETURN; END IF;

  v_monto := ROUND(p_costo / v_count, 2);

  INSERT INTO public.pagos_cancha (partido_id, jugador_id, monto)
  SELECT p_partido_id, jugador_id, v_monto
  FROM public.partido_jugadores
  WHERE partido_id = p_partido_id
  ON CONFLICT DO NOTHING;
END;
$$;
