# Cursor Codechella Passport Email + Guest CRM

React Email invite for **Codechella Hackathon** in **Victoria, BC**, plus a
**Convex-backed guest CRM** at `/guests` styled like the passport credential
(CursorGothic, cream paper, ink, orange accent — not a generic SaaS dashboard).

## Setup

```bash
bun install
```

Start Convex (writes `.env.local` with `VITE_CONVEX_URL` / `VITE_CONVEX_SITE_URL`):

```bash
# Cloud coding agents: isolate from your personal Convex deployment
export CONVEX_AGENT_MODE=anonymous

npx convex dev
```

In another terminal, open the passport app:

```bash
bun run passport:dev
```

- Passport: [http://localhost:3010](http://localhost:3010) (query params or `/{uuid}`)
- Guest CRM: [http://localhost:3010/guests](http://localhost:3010/guests) (alias `/crm`)

## Seed guests (no real PII)

```bash
cp data/guests.example.json data/guests.json
bun run seed:guests
```

`data/guests.json` and `*.csv` are gitignored. Never commit real Codechella
guest emails, photos, or Luma exports.

## Admin send + dry-run

Set secrets on the **Convex deployment** (not in the Vite frontend):

```bash
npx convex env set ADMIN_SECRET 'long-random-string'
npx convex env set CONVEX_SITE_URL "$VITE_CONVEX_SITE_URL"   # tracking base
# Optional — omit RESEND_API_KEY to dry-run:
# npx convex env set RESEND_API_KEY 're_…'
# npx convex env set EMAIL_FROM 'Cursor Codechella <noreply@cursorvictoria.com>'
```

On `/guests`:

1. Paste `ADMIN_SECRET` into the admin field (stored in `localStorage`).
2. Without it, email status pills stay visible but **Send is locked**.
3. With it, **Send** / **Resend** / **Send all unsent** call Convex actions.
4. If `RESEND_API_KEY` is missing, sends **dry-run**: logs to Convex, still
   advances status `none → sent` so the CRM is demoable without emailing people.

Tracking HTTP routes on the Convex site URL:

- `GET /track/open?t=TOKEN` → 1×1 GIF, mark `opened`
- `GET /track/read?t=TOKEN` → mark `read`, 302 to the guest `passportUrl`
  (or `https://luma.com/cursorvictoria` if unset)

Status never goes backwards: `none → sent → opened → read`.

## Preview the email template

```bash
bun run email:dev
```

Open [http://localhost:3001](http://localhost:3001) and select
`cursor-codechella-passport.tsx`. Sends use a faithful HTML version of this
template; CTA **View details** hits `/track/read`.

## Passport query params

```
http://localhost:3010/?firstName=Ada&lastName=Example&company=Analytical%20Engines&location=Victoria,%20BC
```

UUID passports (when the guest has a `passportId`):

```
http://localhost:3010/a1b2c3d4-e5f6-4789-a012-3456789abcde
```

## Typecheck

```bash
bun run typecheck
```

## Env reference

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_CONVEX_URL` | `.env.local` (Vite) | Frontend Convex client |
| `VITE_CONVEX_SITE_URL` | `.env.local` | HTTP actions / tracking base (local) |
| `CONVEX_URL` | seed script | Same as `VITE_CONVEX_URL` |
| `ADMIN_SECRET` | Convex env | Unlocks send actions |
| `RESEND_API_KEY` | Convex env | Real sends; omit = dry-run |
| `EMAIL_FROM` | Convex env | Resend from address |
| `CONVEX_SITE_URL` / `SITE_URL` | Convex env | Tracking link base in emails |
| `CONVEX_AGENT_MODE=anonymous` | shell | Isolated agent Convex backend |
