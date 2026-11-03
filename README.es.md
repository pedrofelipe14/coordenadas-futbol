# CoordeFutbol

[English](README.md) · **Español**

[![CI](https://github.com/pedrofelipe14/coordenadas-futbol/actions/workflows/ci.yml/badge.svg)](https://github.com/pedrofelipe14/coordenadas-futbol/actions/workflows/ci.yml)

App web para **coordinar partidos de fútbol entre grupos de amigos**: convocar a los jugadores, armar los equipos, cargar resultados y estadísticas, y dividir el pago de la cancha.

**App en vivo:** https://coordenadas-futbol.vercel.app

![Pantalla de inicio de CoordeFutbol](docs/landing.jpg)

## Funcionalidades

- **Grupos** con código de invitación para compartir (hasta 2 por jugador), con roles de administrador.
- **Convocatoria semanal** con votación para confirmar quién juega.
- **Partidos**: equipos, resultado y goles por jugador, incluyendo **jugadores invitados** que no son del grupo.
- **Estadísticas** individuales por jugador.
- **Pago de la cancha** dividido en partes iguales, con seguimiento de quién pagó.
- **Chat del grupo** y **alertas en tiempo real** cuando te suman a un partido.
- **Perfil** con foto, dorsal, color y apodo.
- Registro con confirmación por email y recuperación de contraseña.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + React Router
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Tests y CI:** Vitest · GitHub Actions
- **Deploy:** Vercel

## Correr localmente

```bash
npm install
cp .env.example .env   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

### Tests

```bash
npm test
```

Tests unitarios con **Vitest** sobre la lógica de estadísticas (tabla de goleadores, agrupación por mes). En cada push, **GitHub Actions** corre lint, tests y build.

### Base de datos

En el SQL Editor de Supabase, ejecutar `supabase/schema.sql` y después los `supabase/migracion_*.sql`.

En el dashboard de Supabase:
- **Authentication → Email:** activar *Confirm email*.
- **Authentication → SMTP:** configurar un proveedor de mail.
- **Authentication → URL Configuration:** Site URL y Redirect URLs.

## Autor

[@pedrofelipe14](https://github.com/pedrofelipe14)
