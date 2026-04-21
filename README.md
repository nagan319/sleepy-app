# sleepy

A sleep optimization app that helps you shift your sleep schedule toward a target bedtime, track sun exposure, and understand your chronotype.

**Live app: https://sleep-app-swart.vercel.app**

## Features

- **Bedtime targeting** — set a goal bedtime and shift 30 min/day toward it based on your actual sleep logs
- **Chronotype tracking** — lion, bear, or wolf; shows your current circadian zone throughout the day
- **Countdown timers** — caffeine cutoff, last meal, stop work, shower window, no screens
- **Sun exposure** — morning and afternoon 20-min slots with daily checkboxes
- **Sleep log** — log bedtime and wake time each day, delete old entries, view history
- **Social jet lag** — tracks weekday vs weekend sleep variance
- **Real-time sync** — changes sync instantly across all devices and sessions
- **PWA** — installable on mobile (add to home screen)

## Stack

- **Frontend** — Next.js 16, React 19, Tailwind CSS v4
- **Backend** — Supabase (Postgres + Auth + Realtime)
- **Hosting** — Vercel

## Local development

```bash
npm install
npm run dev
```

Required `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Database setup

Run `supabase/schema.sql` in your Supabase SQL Editor.
