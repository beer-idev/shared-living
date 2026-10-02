# Shared Living

A production-oriented shared-home management app built from the supplied Figma/PDF flow. The interface uses a calm pastel blue, orange, and green system, with clear daily actions instead of a generic dashboard template.

## Product features

- Email/password authentication and house onboarding
- Create a house, share a public invite link, or join from the invitation landing page
- Shared expenses, equal splits, receipt uploads, and payment tracking
- Chore assignment by person, random draw, or fair rotation
- Photo proof, completion workflow, and housemate appreciation
- Server-controlled House Harmony score, contribution badges, and celebrations
- Member profiles, contribution history, and owner-controlled member removal
- Notification inbox and per-user notification preferences
- Responsive desktop/mobile navigation, loading states, and error recovery

## Stack

- Next.js 16 App Router, React, TypeScript
- Supabase Auth, Postgres, Row Level Security, Storage, and database functions/triggers
- Server Components for reads and authenticated Server Actions for writes
- Zod validation, Lucide icons, local Nunito Sans variable font

## Run with the preview dataset

The app intentionally falls back to read-only preview data when Supabase variables are absent.

```bash
npm install
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Run with local Supabase

Docker Desktop must be running.

```bash
npx supabase start
npx supabase db reset
```

Copy the API URL and publishable/anon key printed by `npx supabase status` into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_LOCAL_ANON_KEY
```

Restart Next.js after changing environment variables. Seed accounts all use password `sharedliving123`:

- `napat@example.com` — house owner
- `ploy@example.com`
- `kevin@example.com`
- `mei@example.com`

The migration creates all tables, functions, triggers, indexes, RLS policies, and private storage buckets. The seed creates a complete four-person household with expenses, splits, chores, harmony history, celebration, and notifications.

## Connect a hosted Supabase project

Create `.env.local` from `.env.example`, then:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

For a hosted development project, load `supabase/seed.sql` once through the SQL Editor if demo records are wanted. Do not seed production.

## Verification

```bash
npm run lint
npm run build
```

Important files:

- `supabase/migrations/202609250001_initial_schema.sql` — schema, authorization, triggers, and storage
- `supabase/migrations/202610010001_invite_preview.sql` — safe public invite preview function
- `supabase/seed.sql` — local starter users and household records
- `lib/data.ts` — server-only data access layer
- `app/actions` — validated, authenticated mutations
