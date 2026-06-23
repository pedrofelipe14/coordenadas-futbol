-- ============================================================
-- MIGRACIÓN: Trigger para crear perfil automáticamente al registrarse
-- Necesario para que funcione la confirmación de email.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- Función que crea el perfil desde los metadata del usuario
create or replace function public.crear_perfil_en_registro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo crear si vienen los datos de apodo (registro desde la app)
  if NEW.raw_user_meta_data->>'apodo' is not null then
    insert into public.profiles (id, apodo, dorsal, avatar_color)
    values (
      NEW.id,
      NEW.raw_user_meta_data->>'apodo',
      (NEW.raw_user_meta_data->>'dorsal')::int,
      coalesce(NEW.raw_user_meta_data->>'avatar_color', '#8BC53F')
    )
    on conflict (id) do nothing;
  end if;
  return NEW;
end;
$$;

-- Trigger que se ejecuta cuando se inserta un nuevo usuario
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_en_registro();

-- ============================================================
-- PASOS MANUALES EN SUPABASE DASHBOARD
-- ============================================================
-- 1. Ir a Authentication > Providers > Email
-- 2. Activar "Confirm email"
-- 3. Ir a Authentication > URL Configuration
-- 4. En "Redirect URLs" agregar: https://TU-APP.vercel.app/reset-password
--    (también agregar http://localhost:5173/reset-password para desarrollo)
