-- ============================================================
-- Actualización: invitados cuentan para dividir el costo de cancha
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.crear_pagos_partido(p_partido_id uuid, p_costo numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lineup_count   integer;
  v_invitado_count integer;
  v_total          integer;
  v_monto          numeric(10,2);
BEGIN
  SELECT COUNT(*) INTO v_lineup_count
  FROM public.partido_jugadores
  WHERE partido_id = p_partido_id;

  SELECT COUNT(*) INTO v_invitado_count
  FROM public.partido_invitados
  WHERE partido_id = p_partido_id;

  v_total := v_lineup_count + v_invitado_count;

  IF v_total = 0 OR p_costo <= 0 THEN RETURN; END IF;

  v_monto := ROUND(p_costo / v_total, 2);

  INSERT INTO public.pagos_cancha (partido_id, jugador_id, monto)
  SELECT p_partido_id, jugador_id, v_monto
  FROM public.partido_jugadores
  WHERE partido_id = p_partido_id
  ON CONFLICT DO NOTHING;
END;
$$;
