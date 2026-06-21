-- ============================================================
-- SEED: 10 jugadores ficticios para testing
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query
-- Toma el grupo_id del primer grupo existente automáticamente
-- ============================================================

DO $$
DECLARE
  v_grupo uuid;
BEGIN

  -- Tomar el grupo existente automáticamente
  SELECT id INTO v_grupo FROM grupos LIMIT 1;

  IF v_grupo IS NULL THEN
    RAISE EXCEPTION 'No hay ningún grupo creado todavía. Creá uno primero desde la app.';
  END IF;

  -- 1. Insertar cuentas en auth.users (confirmadas, listas para usar)
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES
    ('f1000001-feed-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'lio@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rodri@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'mati@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'nico@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'seba@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'gonza@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'fede@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'agus@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'tomi@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}'),
    ('f1000001-feed-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'emi@fake.coordenadas', crypt('Test1234!', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insertar perfiles vinculados al grupo
  INSERT INTO profiles (id, apodo, dorsal, avatar_color, grupo_id) VALUES
    ('f1000001-feed-0000-0000-000000000001', 'Lio',    10, '#E74C3C', v_grupo),
    ('f1000001-feed-0000-0000-000000000002', 'Rodri',   7, '#3498DB', v_grupo),
    ('f1000001-feed-0000-0000-000000000003', 'Mati',    9, '#2ECC71', v_grupo),
    ('f1000001-feed-0000-0000-000000000004', 'Nico',    3, '#9B59B6', v_grupo),
    ('f1000001-feed-0000-0000-000000000005', 'Seba',    5, '#F39C12', v_grupo),
    ('f1000001-feed-0000-0000-000000000006', 'Gonza',  11, '#1ABC9C', v_grupo),
    ('f1000001-feed-0000-0000-000000000007', 'Fede',    8, '#E67E22', v_grupo),
    ('f1000001-feed-0000-0000-000000000008', 'Agus',    4, '#2980B9', v_grupo),
    ('f1000001-feed-0000-0000-000000000009', 'Tomi',    6, '#27AE60', v_grupo),
    ('f1000001-feed-0000-0000-000000000010', 'Emi',     1, '#8E44AD', v_grupo)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Se crearon 10 jugadores ficticios en el grupo %', v_grupo;

END $$;
