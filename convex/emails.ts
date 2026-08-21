import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action } from "./_generated/server";

const DEFAULT_FROM = "Cursor Codechella <noreply@cursorvictoria.com>";
const SUBJECT = "What to expect at Cursor Codechella Victoria";

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Faithful HTML of the Codechella passport / what-to-expect email
 * (matches src/emails/cursor-codechella-passport.tsx visual language).
 */
function buildEmailHtml(args: {
  firstName: string;
  lastName: string;
  openUrl: string;
  readUrl: string;
}): string {
  const first = args.firstName.trim() || "there";
  const last = args.lastName.trim();
  const preview = last
    ? `${escapeHtml(first)} ${escapeHtml(last)}, your Codechella passport is ready.`
    : `${escapeHtml(first)}, your Codechella passport is ready.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Codechella Hackathon passport</title>
</head>
<body style="margin:0;padding:32px 12px;background:#eceae4;color:#171717;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:440px;background:#fcfcf9;border:1px solid #e4e0d8;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.14em;color:#f54e00;">CURSOR · VICTORIA, BC</p>
              <p style="margin:0;font-size:32px;line-height:1.05;font-weight:700;letter-spacing:-0.03em;color:#171717;">Codechella</p>
              <p style="margin:2px 0 0;font-size:32px;line-height:1.05;font-weight:500;letter-spacing:-0.03em;color:#a3a3a3;">Hackathon</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px;">
              <hr style="border:0;border-top:1px solid #ebe7df;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px 8px;">
              <p style="margin:0 0 10px;font-size:16px;font-weight:600;color:#171717;">Hi ${escapeHtml(first)},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">
                Your Codechella passport is ready. Open it to see your credential
                for Victoria, BC — then share it with builders who should be in the room.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#52525b;">
                Bring a laptop, ship something real, and come ready to demo.
                Check-in starts at 9:30 am. Hacking begins at 10:00 am. Hard submission at 4:30 pm.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#8a847a;">
                Codechella Hackathon<br />
                Victoria, BC · August 22nd
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;text-align:center;">
              <a href="${args.readUrl}"
                 style="display:inline-block;background:#171717;color:#fcfcf9;font-size:14px;font-weight:500;text-decoration:none;padding:12px 20px;border-radius:8px;">
                View details
              </a>
              <p style="margin:14px 0 0;font-size:11px;color:#a8a29a;">
                Event credential — not a travel document
              </p>
              <img src="${args.openUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
