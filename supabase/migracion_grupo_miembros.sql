-- ============================================================
-- Multi-grupo: cada usuario puede pertenecer a hasta 2 grupos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de membresías
CREATE TABLE IF NOT EXISTS public.grupo_miembros (
  perfil_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grupo_id  uuid NOT NULL REFERENCES public.grupos(id)   ON DELETE CASCADE,
  es_admin  boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (perfil_id, grupo_id)
);

ALTER TABLE public.grupo_miembros ENABLE ROW LEVEL SECURITY;

-- Ver propias membresías
CREATE POLICY "membresias_select_propia" ON public.grupo_miembros
  FOR SELECT USING (perfil_id = auth.uid());

-- Miembros del grupo activo se ven entre sí
CREATE POLICY "membresias_select_grupo_activo" ON public.grupo_miembros
  FOR SELECT USING (
    grupo_id = (SELECT grupo_id FROM public.profiles WHERE id = auth.uid())
  );

-- Insertar propia membresía (cliente — crearGrupo / unirseAGrupo)
CREATE POLICY "membresias_insert_propia" ON public.grupo_miembros
  FOR INSERT WITH CHECK (perfil_id = auth.uid());

-- Borrar propia membresía (cliente — salirDeGrupo)
CREATE POLICY "membresias_delete_propia" ON public.grupo_miembros
  FOR DELETE USING (perfil_id = auth.uid());

-- 2. Migrar membresías existentes desde profiles
INSERT INTO public.grupo_miembros (perfil_id, grupo_id, es_admin)
SELECT id, grupo_id, es_admin
FROM public.profiles
WHERE grupo_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Política en grupos: poder leer cualquier grupo del que seas miembro
--    (necesario para el selector de grupo cuando hay 2 grupos)
CREATE POLICY "grupos_select_miembro" ON public.grupos
  FOR SELECT USING (
    id IN (
      SELECT grupo_id FROM public.grupo_miembros WHERE perfil_id = auth.uid()
    )
  );

-- 4. Actualizar promover_admin para sincronizar grupo_miembros
CREATE OR REPLACE FUNCTION public.promover_admin(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_grupo_id uuid;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM public.profiles WHERE id = auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM public.grupos WHERE id = v_grupo_id AND creado_por = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Solo el creador puede dar permisos de admin';
  END IF;

  UPDATE public.profiles SET es_admin = true
    WHERE id = p_user_id AND grupo_id = v_grupo_id;

  UPDATE public.grupo_miembros SET es_admin = true
    WHERE perfil_id = p_user_id AND grupo_id = v_grupo_id;
END;
$$;

-- 5. Actualizar quitar_admin para sincronizar grupo_miembros
CREATE OR REPLACE FUNCTION public.quitar_admin(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_grupo_id uuid;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM public.profiles WHERE id = auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM public.grupos WHERE id = v_grupo_id AND creado_por = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Solo el creador puede quitar permisos de admin';
  END IF;

  UPDATE public.profiles SET es_admin = false
    WHERE id = p_user_id AND grupo_id = v_grupo_id;

  UPDATE public.grupo_miembros SET es_admin = false
    WHERE perfil_id = p_user_id AND grupo_id = v_grupo_id;
END;
$$;

-- 6. Actualizar eliminar_grupo para manejar miembros con 2 grupos
CREATE OR REPLACE FUNCTION public.eliminar_grupo()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_grupo_id uuid;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM public.profiles WHERE id = v_uid;

  IF NOT EXISTS (
    SELECT 1 FROM public.grupos WHERE id = v_grupo_id AND creado_por = v_uid
  ) THEN
    RAISE EXCEPTION 'Solo el creador puede eliminar el grupo';
  END IF;

  -- Para cada miembro con este grupo activo: cambiar al otro grupo (o null)
  UPDATE public.profiles p SET
    grupo_id = (
      SELECT gm.grupo_id FROM public.grupo_miembros gm
      WHERE gm.perfil_id = p.id AND gm.grupo_id != v_grupo_id
      LIMIT 1
    ),
    es_admin = COALESCE((
      SELECT gm.es_admin FROM public.grupo_miembros gm
      WHERE gm.perfil_id = p.id AND gm.grupo_id != v_grupo_id
      LIMIT 1
    ), false)
  WHERE p.grupo_id = v_grupo_id;

  -- Eliminar el grupo (CASCADE borra grupo_miembros, partidos, mensajes, goles)
  DELETE FROM public.grupos WHERE id = v_grupo_id;
END;
$$;
