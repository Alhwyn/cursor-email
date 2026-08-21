import { useAction, useQuery } from "convex/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import "./guests.css";

const ADMIN_SECRET_KEY = "codechella_admin_secret";

type EmailStatus = "none" | "sent" | "opened" | "read";

function initialsFor(name: string, firstName: string, lastName: string): string {
  const fromParts = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim();
  if (fromParts.length > 0) return fromParts.toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function GuestAvatar({
  name,
  firstName,
  lastName,
  photoUrl,
}: {
  name: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}) {
  const initials = initialsFor(name, firstName, lastName);
  if (photoUrl) {
    return (
      <span className="crm-avatar">
        <img src={photoUrl} alt="" loading="lazy" decoding="async" />
      </span>
    );
  }
  return (
    <span className="crm-avatar" aria-hidden>
      <span className="crm-avatar-fallback">{initials}</span>
    </span>
  );
}

function EmailStatusPill({ status }: { status: EmailStatus }) {
  switch (status) {
    case "none":
      return <span className="crm-pill crm-pill--none">Not sent</span>;
    case "sent":
      return <span className="crm-pill crm-pill--sent">Sent</span>;
    case "opened":
      return <span className="crm-pill crm-pill--opened">Opened</span>;
    case "read":
      return <span className="crm-pill crm-pill--read">Read</span>;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function EmptyCell({ children }: { children?: ReactNode }) {
  return <span className="crm-muted">{children ?? "—"}</span>;
}

function SendButton({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="crm-btn"
      onClick={onClick}
      disabled={disabled || busy}
    >
      {busy ? "Sending…" : label}
    </button>
  );
}

function GuestsHeader() {
  return (
    <header className="crm-header">
      <div className="crm-header-inner">
        <a href="/" className="crm-brand" aria-label="Codechella passport home">
          <img
            src="/assets/cursor-lockup-light.png"
            alt="Cursor"
            width={88}
            height={21}
          />
          <span className="crm-brand-mark">Codechella</span>
        </a>
        <nav className="crm-nav" aria-label="Primary">
          <a href="/">Passport</a>
          <span aria-current="page">Guests</span>
        </nav>
      </div>
    </header>
  );
}

export function GuestsPage() {
  const guests = useQuery(api.guests.listGuests);
  const sendGuestEmail = useAction(api.emails.sendGuestEmail);
  const sendAllUnsent = useAction(api.emails.sendAllUnsent);

  const [query, setQuery] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [adminReady, setAdminReady] = useState(false);
  const [sendingId, setSendingId] = useState<Id<"guests"> | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Guests · Codechella Passport";
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_SECRET_KEY) ?? "";
      setAdminSecret(stored);
    } catch {
      // ignore
    }
    setAdminReady(true);
  }, []);

  const isAdmin = adminReady && adminSecret.trim().length > 0;

  const filtered = useMemo(() => {
    if (!guests) return [];
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(guest => {
      const haystack =
        `${guest.name} ${guest.email} ${guest.company} ${guest.city}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [guests, query]);

  const unsentCount = useMemo(() => {
    if (!guests) return 0;
    return guests.filter(g => g.emailStatus === "none").length;
  }, [guests]);

  function persistAdminSecret(value: string) {
    setAdminSecret(value);
    try {
      if (value.trim()) {
        localStorage.setItem(ADMIN_SECRET_KEY, value);
      } else {
        localStorage.removeItem(ADMIN_SECRET_KEY);
      }
    } catch {
      // ignore
    }
  }

  async function handleSend(guestId: Id<"guests">) {
    if (!adminSecret.trim()) return;
    setSendingId(guestId);
    setAdminMessage(null);
    try {
      const result = await sendGuestEmail({
        guestId,
        adminSecret: adminSecret.trim(),
      });
      setAdminMessage(
        result.dryRun
          ? "Dry-run: marked sent (no RESEND_API_KEY)."
          : "Email sent.",
      );
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : "Send failed.",
      );
    } finally {
      setSendingId(null);
    }
  }

  async function handleSendAll() {
    if (!adminSecret.trim()) return;
    setSendingAll(true);
    setAdminMessage(null);
    try {
      const result = await sendAllUnsent({
        adminSecret: adminSecret.trim(),
      });
      const suffix = result.dryRun ? " (dry-run)" : "";
      const err =
        result.errors.length > 0
          ? ` Errors: ${result.errors.slice(0, 3).join("; ")}`
          : "";
      setAdminMessage(
        `Sent ${result.sent}/${result.attempted} unsent guests${suffix}.${err}`,
      );
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : "Send all failed.",
      );
    } finally {
      setSendingAll(false);
    }
  }

  return (
    <div className="crm-page">
      <GuestsHeader />
      <main className="crm-main">
        <div className="crm-hero">
          <div>
            <p className="crm-eyebrow">Directory</p>
            <h1 className="crm-title">Guests</h1>
            <p className="crm-lede">
              Codechella attendee CRM — photos, tickets, and passport email
              status on the same paper stock as the credential.
            </p>
          </div>
          <label>
            <span className="sr-only">Search guests</span>
            <input
              type="search"
              className="crm-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email"
            />
          </label>
        </div>

        <div className="crm-admin">
          <label>
            <span className="crm-admin-label">
              Admin secret (required to send mail)
            </span>
            <input
              type="password"
              value={adminSecret}
              onChange={e => persistAdminSecret(e.target.value)}
              placeholder="Paste ADMIN_SECRET"
              autoComplete="off"
            />
          </label>
          {isAdmin ? (
            <div className="crm-admin-actions">
              <SendButton
                label={`Send all unsent (${unsentCount})`}
                busy={sendingAll}
                disabled={unsentCount === 0}
                onClick={() => void handleSendAll()}
              />
              {adminMessage ? (
                <p className="crm-admin-message">{adminMessage}</p>
              ) : null}
            </div>
          ) : (
            <p className="crm-admin-hint">
              Enter the organizer secret to unlock Send. Status stays visible
              either way.
            </p>
          )}
        </div>

        {guests === undefined ? (
          <p className="crm-empty">Loading guests…</p>
        ) : guests.length === 0 ? (
          <p className="crm-empty">
            No guests yet. Copy{" "}
            <code>data/guests.example.json</code> to{" "}
            <code>data/guests.json</code> and run{" "}
            <code>bun run seed:guests</code>.
          </p>
        ) : filtered.length === 0 ? (
          <p className="crm-empty">No guests match “{query}”.</p>
        ) : (
          <>
            <p className="crm-count">
              {filtered.length} of {guests.length} guests
            </p>

            <ul className="crm-cards">
              {filtered.map(guest => (
                <li key={guest._id} className="crm-card">
                  <div className="crm-card-top">
                    <GuestAvatar
                      name={guest.name}
                      firstName={guest.firstName}
                      lastName={guest.lastName}
                      photoUrl={guest.resolvedPhotoUrl}
                    />
                    <div className="crm-card-body">
                      <div className="crm-card-name-row">
                        <strong>{guest.name}</strong>
                        <EmailStatusPill status={guest.emailStatus} />
                      </div>
                      <p className="crm-card-meta">{guest.email}</p>
                      <p className="crm-card-meta">
                        {guest.ticketName || "—"}
                        {(guest.city || guest.company) && (
                          <>
                            {" · "}
                            {[guest.city, guest.company]
                              .filter(Boolean)
                              .join(" · ")}
                          </>
                        )}
                      </p>
                      {guest.building ? (
                        <p className="crm-card-building">{guest.building}</p>
                      ) : null}
                      <div className="crm-card-actions">
                        {isAdmin ? (
                          <SendButton
                            label={
                              guest.emailStatus === "none" ? "Send" : "Resend"
                            }
                            busy={sendingId === guest._id}
                            onClick={() => void handleSend(guest._id)}
                          />
                        ) : (
                          <span className="crm-locked">Mail locked</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Email</th>
                    <th>Ticket</th>
                    <th>City</th>
                    <th>Company</th>
                    <th>Building</th>
                    <th>Status</th>
                    <th>Mail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(guest => (
                    <tr key={guest._id}>
                      <td>
                        <div className="crm-guest-cell">
                          <GuestAvatar
                            name={guest.name}
                            firstName={guest.firstName}
                            lastName={guest.lastName}
                            photoUrl={guest.resolvedPhotoUrl}
                          />
                          <div>
                            <strong>{guest.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td className="crm-email">{guest.email}</td>
                      <td>{guest.ticketName || <EmptyCell />}</td>
                      <td>{guest.city || <EmptyCell />}</td>
                      <td>{guest.company || <EmptyCell />}</td>
                      <td className="crm-building">
                        {guest.building || <EmptyCell />}
                      </td>
                      <td>
                        <EmailStatusPill status={guest.emailStatus} />
                      </td>
                      <td>
                        {isAdmin ? (
                          <SendButton
                            label={
                              guest.emailStatus === "none" ? "Send" : "Resend"
                            }
                            busy={sendingId === guest._id}
                            onClick={() => void handleSend(guest._id)}
                          />
                        ) : (
                          <span className="crm-locked">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
