import { useQuery } from "convex/react";
import { useEffect, useMemo } from "react";
import { api } from "../../convex/_generated/api";
import {
  buildEmailHtml,
  previewCtaUrl,
  WHAT_TO_EXPECT_SUBJECT,
} from "../emails/whatToExpectHtml";
import "./guests.css";

export type EmailPreviewParams = {
  passportId?: string;
  email?: string;
};

export function EmailPreviewPage({ passportId, email }: EmailPreviewParams) {
  const byPassport = useQuery(
    api.guests.getGuestByPassportId,
    passportId ? { passportId } : "skip",
  );
  const byEmail = useQuery(
    api.guests.getGuestByEmail,
    !passportId && email ? { email } : "skip",
  );

  const guest = passportId ? byPassport : byEmail;
  const loading =
    (passportId && byPassport === undefined) ||
    (!passportId && email && byEmail === undefined);

  const html = useMemo(() => {
    if (!guest) return null;
    return buildEmailHtml({
      firstName: guest.firstName,
      lastName: guest.lastName,
      readUrl: previewCtaUrl(guest.passportUrl),
      // Preview only — no open-tracking pixel
    });
  }, [guest]);

  useEffect(() => {
    const label = guest
      ? `${guest.firstName} ${guest.lastName}`.trim() || guest.email
      : "Guest";
    document.title = `Email preview · ${label}`;
  }, [guest]);

  return (
    <div className="crm-page email-preview-page">
      <header className="crm-header">
        <div className="crm-header-inner">
          <a href="/guests" className="crm-brand" aria-label="Back to guests">
            <img
              src="/assets/cursor-lockup-light.png"
              alt="Cursor"
              width={88}
              height={21}
            />
            <span className="crm-brand-mark">Codechella</span>
          </a>
          <nav className="crm-nav" aria-label="Primary">
            <a href="/guests">Guests</a>
            <span aria-current="page">Email preview</span>
          </nav>
        </div>
      </header>

      <main className="crm-main email-preview-main">
        <div className="crm-hero email-preview-hero">
          <div>
            <p className="crm-eyebrow">Preview only</p>
            <h1 className="crm-title">What to expect</h1>
            <p className="crm-lede">
              Same HTML as the send pipeline — not mailed, no Resend, no
              tracking pixels.
            </p>
          </div>
          {guest ? (
            <p className="email-preview-meta">
              To: {guest.email}
              <br />
              Subject: {WHAT_TO_EXPECT_SUBJECT}
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="crm-empty">Loading guest…</p>
        ) : !guest ? (
          <p className="crm-empty">
            Guest not found. Use <code>{`/email-preview/{passportId}`}</code> or{" "}
            <code>/email-preview?email=…</code>.
          </p>
        ) : html ? (
          <iframe
            className="email-preview-frame"
            title={`Email preview for ${guest.name}`}
            srcDoc={html}
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        ) : null}
      </main>
    </div>
  );
}

/** Build href for the CRM Preview column. */
export function emailPreviewHref(guest: {
  email: string;
  passportId?: string;
}): string {
  if (guest.passportId?.trim()) {
    return `/email-preview/${encodeURIComponent(guest.passportId.trim())}`;
  }
  return `/email-preview?email=${encodeURIComponent(guest.email)}`;
}
