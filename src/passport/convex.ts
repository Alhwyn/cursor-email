import { ConvexReactClient } from "convex/react";

/**
 * Vite inlines `import.meta.env.VITE_CONVEX_URL` from `.env.local`
 * (written by `npx convex init` / `npx convex dev`).
 * Seed scripts use `CONVEX_URL` (same value).
 */
const convexUrl =
  import.meta.env.VITE_CONVEX_URL ?? import.meta.env.CONVEX_URL;

if (!convexUrl || typeof convexUrl !== "string") {
  throw new Error(
    "Missing VITE_CONVEX_URL. Run `npx convex dev` (writes .env.local) or set VITE_CONVEX_URL.",
  );
}

export const convex = new ConvexReactClient(convexUrl);
