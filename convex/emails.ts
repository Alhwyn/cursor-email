import { v } from "convex/values";
import {
  buildEmailHtml,
  WHAT_TO_EXPECT_SUBJECT,
} from "../src/emails/whatToExpectHtml";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action } from "./_generated/server";

const DEFAULT_FROM = "Cursor Codechella <noreply@cursorvictoria.com>";
const SUBJECT = WHAT_TO_EXPECT_SUBJECT;

function assertAdmin(adminSecret: string): void {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    throw new Error(
      "ADMIN_SECRET is not configured on the Convex deployment. Set it with `npx convex env set ADMIN_SECRET …`.",
    );
  }
  if (adminSecret !== expected) {
    throw new Error("Unauthorized");
  }
}

function trackingBaseUrl(): string {
  const raw = process.env.CONVEX_SITE_URL || process.env.SITE_URL || "";
  const base = raw.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "Missing CONVEX_SITE_URL (or SITE_URL) for email tracking links.",
    );
  }
  return base;
}

async function deliverEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ dryRun: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  if (!apiKey) {
    console.log(
      `[dry-run] Would send email to ${args.to} from ${from}: ${args.subject}`,
    );
    return { dryRun: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend error:", detail);
    throw new Error("Failed to send email via Resend");
  }

  return { dryRun: false };
}

async function sendOne(
  ctx: ActionCtx,
  guestId: Id<"guests">,
): Promise<{ dryRun: boolean }> {
  const guest = await ctx.runMutation(internal.guests.prepareGuestSend, {
    guestId,
  });

  const base = trackingBaseUrl();
  const openUrl = `${base}/track/open?t=${encodeURIComponent(guest.emailToken)}`;
  const readUrl = `${base}/track/read?t=${encodeURIComponent(guest.emailToken)}`;

  const html = buildEmailHtml({
    firstName: guest.firstName,
    lastName: guest.lastName,
    openUrl,
    readUrl,
  });

  const { dryRun } = await deliverEmail({
    to: guest.email,
    subject: SUBJECT,
    html,
  });

  await ctx.runMutation(internal.guests.markEmailSent, {
    guestId: guest.guestId,
  });

  return { dryRun };
}

/**
 * Admin-only: send the passport / what-to-expect email to one guest.
 * Requires ADMIN_SECRET. Without RESEND_API_KEY, dry-runs and still marks sent.
 * CTA "View details" tracks via /track/read then 302s to passportUrl or Luma.
 */
export const sendGuestEmail = action({
  args: {
    guestId: v.id("guests"),
    adminSecret: v.string(),
  },
  returns: v.object({
    ok: v.literal(true),
    dryRun: v.boolean(),
  }),
  handler: async (ctx, args): Promise<{ ok: true; dryRun: boolean }> => {
    assertAdmin(args.adminSecret);
    const { dryRun } = await sendOne(ctx, args.guestId);
    return { ok: true as const, dryRun };
  },
});

/**
 * Admin-only: send to every guest still at emailStatus "none".
 */
export const sendAllUnsent = action({
  args: {
    adminSecret: v.string(),
  },
  returns: v.object({
    attempted: v.number(),
    sent: v.number(),
    dryRun: v.boolean(),
    errors: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    attempted: number;
    sent: number;
    dryRun: boolean;
    errors: string[];
  }> => {
    assertAdmin(args.adminSecret);

    const ids: Id<"guests">[] = await ctx.runQuery(
      internal.guests.listUnsentGuestIds,
      {},
    );
    let sent = 0;
    let anyDryRun = !process.env.RESEND_API_KEY;
    const errors: string[] = [];

    for (const guestId of ids) {
      try {
        const result = await sendOne(ctx, guestId);
        sent += 1;
        anyDryRun = anyDryRun || result.dryRun;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown send error";
        errors.push(`${guestId}: ${message}`);
      }
    }

    return {
      attempted: ids.length,
      sent,
      dryRun: anyDryRun,
      errors,
    };
  },
});
