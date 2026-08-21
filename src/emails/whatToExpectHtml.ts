/**
 * Shared What-to-expect / passport email HTML.
 * Used by Convex sends and the /email-preview route (preview only — no Resend).
 */

export const WHAT_TO_EXPECT_SUBJECT =
  "What to expect at Cursor Codechella Victoria";

export const FALLBACK_PASSPORT_CTA = "https://luma.com/cursorvictoria";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type BuildEmailHtmlArgs = {
  firstName: string;
  lastName: string;
  /** CTA href — tracking URL when sending; passportUrl when previewing. */
  readUrl: string;
  /** Open-pixel URL when sending; omit / empty for preview (no tracking). */
  openUrl?: string;
};

/**
 * Faithful HTML of the Codechella passport / what-to-expect email
 * (matches src/emails/cursor-codechella-passport.tsx visual language).
 */
export function buildEmailHtml(args: BuildEmailHtmlArgs): string {
  const first = args.firstName.trim() || "there";
  const last = args.lastName.trim();
  const preview = last
    ? `${escapeHtml(first)} ${escapeHtml(last)}, your Codechella passport is ready.`
    : `${escapeHtml(first)}, your Codechella passport is ready.`;

  const openPixel = args.openUrl
    ? `<img src="${args.openUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
    : "";

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
              ${openPixel}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Preview CTA: guest passport URL, else Luma fallback. No tracking. */
export function previewCtaUrl(passportUrl: string | undefined): string {
  const url = passportUrl?.trim();
  return url && url.length > 0 ? url : FALLBACK_PASSPORT_CTA;
}
