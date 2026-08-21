#!/usr/bin/env bun
/**
 * Seed guests into Convex from a local JSON file.
 *
 * 1. Copy data/guests.example.json → data/guests.json (gitignored)
 * 2. Ensure `npx convex dev` is running (or CONVEX_URL / VITE_CONVEX_URL is set)
 * 3. bun run seed:guests
 *
 * Never commit real guest CSVs, emails, phones, or photos.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

type GuestSeed = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  ticketName: string;
  city: string;
  company: string;
  building: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  passportUrl?: string;
  passportId?: string;
  photoUrl?: string;
  lumaGuestId?: string;
  emailStatus?: "none" | "sent" | "opened" | "read";
  sentAt?: number;
  openedAt?: number;
  readAt?: number;
};

const dataPath = process.argv[2] ?? "data/guests.json";
const convexUrl =
  process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;

if (!convexUrl) {
  console.error(
    "Missing CONVEX_URL (or VITE_CONVEX_URL). Run `npx convex dev` first (writes .env.local), or export CONVEX_URL.",
  );
  process.exit(1);
}

const file = Bun.file(dataPath);
if (!(await file.exists())) {
  console.error(
    `Missing ${dataPath}. Copy data/guests.example.json → data/guests.json and fill it in.`,
  );
  process.exit(1);
}

const guests = (await file.json()) as GuestSeed[];
if (!Array.isArray(guests)) {
  console.error("Expected guests JSON to be an array of guest objects.");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
const result = await client.mutation(api.guests.upsertGuests, { guests });

console.log(
  `Seeded ${guests.length} guests → inserted ${result.inserted}, updated ${result.updated}`,
);
