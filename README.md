# CoordeFutbol

**English** · [Español](README.es.md)

[![CI](https://github.com/pedrofelipe14/coordenadas-futbol/actions/workflows/ci.yml/badge.svg)](https://github.com/pedrofelipe14/coordenadas-futbol/actions/workflows/ci.yml)

A web app for **organizing pickup football (soccer) games among groups of friends**: call players up, pick teams, record results and stats, and split the cost of the pitch.

**Live app:** https://coordenadas-futbol.vercel.app

![CoordeFutbol landing page](docs/landing.jpg)

> The app's interface is in Spanish.

## Features

- **Groups** with a shareable invite code (up to 2 per player) and admin roles.
- **Weekly call-up** where players vote to confirm who's playing.
- **Matches**: teams, score and goals per player, including **guest players** from outside the group.
- Individual **player stats**.
- **Pitch fee** split evenly, tracking who has paid.
- **Group chat** and **real-time alerts** when you're added to a match.
- **Profile** with photo, shirt number, color and nickname.
- Sign-up with email confirmation and password recovery.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + React Router
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Tests & CI:** Vitest · GitHub Actions
- **Deploy:** Vercel

## Running locally

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Tests

```bash
npm test
```

**Vitest** unit tests cover the stats logic (top-scorer table, grouping by month). On every push, **GitHub Actions** runs lint, tests and the build.

### Database

In the Supabase SQL Editor, run `supabase/schema.sql` and then the `supabase/migracion_*.sql` files.

In the Supabase dashboard:
- **Authentication → Email:** enable *Confirm email*.
- **Authentication → SMTP:** set up an email provider.
- **Authentication → URL Configuration:** Site URL and Redirect URLs.

## Author

[@pedrofelipe14](https://github.com/pedrofelipe14)
