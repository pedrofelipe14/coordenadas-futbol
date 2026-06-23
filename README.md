# CoordeFutbol

App para coordinar partidos de fútbol entre grupos de amigos. Cargás el partido, armás los equipos, llevás las estadísticas y gestionás el pago de la cancha.

## Features

- Registro y login con confirmación de mail
- Creación de grupos con código de invitación compartible
- Hasta 2 grupos por jugador
- Cargar partidos: equipos, resultado, goles por jugador
- Estadísticas individuales por jugador
- Pagos de cancha: asignación automática por partes iguales con seguimiento de quién pagó
- Alertas en tiempo real cuando te agregan a un partido
- Perfil con foto, dorsal y color personalizables
- Panel de administración del grupo

## Stack

- **Frontend:** React 19 + TypeScript + Vite + React Router
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Email:** Gmail SMTP vía Supabase Auth

## Setup

```bash
npm install
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase

Ejecutar los archivos de `supabase/` en el SQL Editor en este orden:

1. `schema.sql`
2. `migracion_*.sql` (en orden cronológico)

Configurar en el dashboard:
- Authentication → Email → activar **Confirm email**
- Authentication → SMTP → configurar proveedor de mail
- Authentication → URL Configuration → Site URL y Redirect URLs

## Autor

Pedro Marchiori · [marchioripedro1@gmail.com](mailto:marchioripedro1@gmail.com)
