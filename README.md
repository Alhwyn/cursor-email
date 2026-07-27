# Cursor Codechella Passport Email

Small React Email invite for **Codechella Hackathon** in **Victoria, BC**. The CTA opens a personal **React** passport page styled like an event credential (Cursor design — not a travel document).

## Setup

```bash
bun install
```

## Preview the email

```bash
bun run email:dev
```

Open [http://localhost:3001](http://localhost:3001) and select `cursor-codechella-passport.tsx`.

## Open the React passport page

```bash
bun run passport:dev
```

Then open a personalized link:

```
http://localhost:3010/?firstName=Alhwyn&lastName=Geonzon&title=Founder&company=Photobomb.online&passportNumber=CUR2026001&accessTier=Builder&location=Victoria,%20BC
```

Query params drive the passport fields. Pass the same URL as `passportUrl` when sending with Resend later.

## Typecheck

```bash
bun run typecheck
```
