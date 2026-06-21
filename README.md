# Fútbol entre amigos

App web para trackear los partidos de fútbol 5/7/9 del grupo: dónde se jugó, a qué hora, resultado, goleadores, y estadísticas por temporada (mes).

Estética: panel de menú de videojuego deportivo (FIFA/PES 2012-2014), verde césped + acento lima, tipografía condensada en mayúsculas.

## Stack

- React + TypeScript + Vite
- React Router (navegación)
- Supabase (auth + base de datos compartida en tiempo real)

## 1. Instalar dependencias

```bash
npm install
```

## 2. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) y creá una cuenta (gratis).
2. Creá un **New project**. Elegí cualquier nombre y región (la más cercana a Argentina es `South America (São Paulo)`).
3. Cuando el proyecto esté listo, andá a **Project Settings > API**. Ahí vas a encontrar:
   - **Project URL** → va en `VITE_SUPABASE_URL`
   - **anon public key** → va en `VITE_SUPABASE_ANON_KEY`

## 3. Configurar las variables de entorno

Copiá `.env.example` a `.env`:

```bash
cp .env.example .env
```

Y completá los dos valores con los datos del paso anterior.

## 4. Crear las tablas en Supabase

1. En el dashboard de Supabase, andá a **SQL Editor > New query**.
2. Abrí el archivo `supabase/schema.sql` de este proyecto, copiá todo el contenido, pegalo en el editor y ejecutalo (botón **Run**).

Esto crea las tablas `profiles`, `partidos` y `goles`, con los permisos necesarios para que cualquier amigo logueado pueda ver y cargar datos.

### Opcional: que no pida confirmar el mail

Por defecto, Supabase manda un mail de confirmación al crear una cuenta. Para un grupo de amigos, probablemente prefieras que entren directo:

1. Andá a **Authentication > Sign In / Providers > Email**.
2. Desactivá **Confirm email**.

## 5. Correr la app en desarrollo

```bash
npm run dev
```

Se abre en `http://localhost:5173`.

## 6. Subir la app a internet (para que tus amigos la usen)

Cualquiera de estas opciones tiene plan gratuito y anda perfecto con un proyecto Vite:

- **[Vercel](https://vercel.com)**: conectás el repo de GitHub y listo, detecta Vite automáticamente. Acordate de cargar las mismas variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en **Project Settings > Environment Variables**.
- **[Netlify](https://netlify.com)**: mismo flujo.

Build command: `npm run build` — output directory: `dist`.

## Cómo está organizado el código

```
src/
  lib/
    supabase.ts       → cliente de Supabase
    AuthContext.tsx   → maneja sesión y perfil de jugador logueado
    data.ts           → todas las consultas (fetch/crear/borrar partidos, cálculo de goleadores)
  pages/
    Login.tsx         → entrar / crear jugador
    Home.tsx          → resumen del mes, goleadores, lista de partidos
    NuevoPartido.tsx  → formulario de carga de partido
    DetallePartido.tsx → ver y borrar un partido puntual
    Plantel.tsx       → histórico de todos los jugadores
  components/
    Header.tsx, PlayerCard.tsx, Scoreboard.tsx
supabase/
  schema.sql          → esquema completo de la base de datos
```

## Cosas a tener en cuenta

- **Permisos**: ahora mismo, cualquier amigo logueado puede cargar, editar o borrar cualquier partido (no solo los suyos). Es lo más simple para un grupo chico de confianza. Si más adelante querés restringir esto (por ejemplo, que solo quien creó el partido pueda borrarlo), se ajusta en las políticas RLS del archivo `schema.sql`.
- **Apodos únicos**: el campo `apodo` es único en la base, así que dos jugadores no pueden tener el mismo.
- **Próximos pasos posibles**: control de gastos por persona, perfiles con foto, ranking de equipos, exportar la temporada a PDF. Avisame si querés que sumemos alguno.
