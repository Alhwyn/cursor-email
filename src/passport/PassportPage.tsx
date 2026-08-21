import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  buildMrz,
  defaultPassportData,
  readPassportFromSearch,
  socialHandle,
  type PassportData,
} from "./passportData";
import "./passport.css";

function IdentityRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="row">
      <div className="label">{label}</div>
      {href ? (
        <a
          className="value value-link"
          href={href}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <div className="value">{value}</div>
      )}
    </div>
  );
}

function guestToPassport(guest: {
  firstName: string;
  lastName: string;
  company: string;
  city: string;
  passportId?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  resolvedPhotoUrl: string | null;
}): PassportData {
  return {
    ...defaultPassportData,
    firstName: guest.firstName || defaultPassportData.firstName,
    lastName: guest.lastName || defaultPassportData.lastName,
    company: guest.company || defaultPassportData.company,
    location: guest.city || defaultPassportData.location,
    passportNumber:
      guest.passportId?.toUpperCase().startsWith("CURSOR")
        ? guest.passportId
        : guest.passportId
          ? `CURSOR${guest.passportId.slice(0, 8).toUpperCase()}`
          : defaultPassportData.passportNumber,
    linkedin: guest.linkedin ?? "",
    twitter: guest.twitter ?? "",
    github: guest.github ?? "",
  };
}

export function PassportPage({ passportId }: { passportId?: string }) {
  const guest = useQuery(
    api.guests.getGuestByPassportId,
    passportId ? { passportId } : "skip",
  );

  const [queryData, setQueryData] = useState<PassportData>(() =>
    readPassportFromSearch(window.location.search),
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQueryData(readPassportFromSearch(window.location.search));
    const onPopState = () => {
      setQueryData(readPassportFromSearch(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const data = useMemo(() => {
    if (passportId && guest) {
      return guestToPassport(guest);
    }
    return queryData;
  }, [passportId, guest, queryData]);

  const photoSrc =
    (passportId && guest?.resolvedPhotoUrl) || "/assets/portrait.png";

  useEffect(() => {
    document.title = `${data.firstName} ${data.lastName} · Codechella Passport`;
  }, [data.firstName, data.lastName]);

  const [mrz1, mrz2] = useMemo(() => buildMrz(), []);
  const stackNames =
    data.firstName.length > 9 || data.lastName.length > 9;

  function toggleOpen() {
    setIsOpen(open => !open);
  }

  return (
    <div className={`page ${isOpen ? "page-open" : "page-closed"}`}>
      <div className="book-stage">
        <div className={`book ${isOpen ? "is-open" : ""}`} id="passport">
          {/* Flipping leaf: cover (closed) / credits (open). Hinge at top. */}
          <div className="flip">
            <button
              type="button"
              className="face face-cover"
              onClick={toggleOpen}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close passport" : "Open passport"}
            >
              <img
                className="cover-building"
                src="/assets/victoria-parliament-cover.png"
                alt=""
                width={460}
                height={268}
              />
              <img
                className="cover-wordmark"
                src="/assets/cursor-lockup-light.png"
                alt="Cursor"
                width={140}
                height={33}
              />
              <div className="cover-title">Codechella</div>
              <div className="cover-subtitle">Hackathon</div>
              <div className="cover-meta">{data.location}</div>
            </button>

            <section className="face face-credits" aria-label="Credits and sponsors">
              <div className="spine spine-left">Credits &amp; Sponsors</div>
              <div className="page-top-main">
                <div className="header">
                  <img
                    className="cursor-wordmark"
                    src="/assets/cursor-lockup-light.png"
                    alt="Cursor"
                    width={120}
                    height={28}
                  />
                  <h1 className="event-title">{data.eventTitle}</h1>
                </div>
                <div className="boats-zone" aria-hidden="true">
                  <img
                    className="watermark-watertaxis"
                    src="/assets/watertaxis.png"
                    alt=""
                    draggable={false}
                  />
                </div>
                <div className="sponsor-banners" aria-label="Sponsors">
                  <div className="sponsor-row">
                    <img src="/assets/sponsors/row/solana.png" alt="Solana" draggable={false} />
                    <img src="/assets/sponsors/row/convex.png" alt="Convex" draggable={false} />
                    <img src="/assets/sponsors/row/shipaton.png" alt="Ship-a-ton" draggable={false} />
                    <img src="/assets/sponsors/row/uvec.png" alt="UVEC" draggable={false} />
                    <img src="/assets/sponsors/row/gmi.png" alt="GMI" draggable={false} />
                  </div>
                  <div className="sponsor-row">
                    <img src="/assets/sponsors/row/elevenlabs.png" alt="ElevenLabs" draggable={false} />
                    <img src="/assets/sponsors/row/exa.png" alt="Exa" draggable={false} />
                    <img src="/assets/sponsors/row/render.png" alt="Render" draggable={false} />
                    <img src="/assets/sponsors/row/firecrawl.png" alt="Firecrawl" draggable={false} />
                    <img src="/assets/sponsors/row/wispr-flow.png" alt="Wispr Flow" draggable={false} />
                    <img src="/assets/sponsors/row/mintlify.png" alt="Mintlify" draggable={false} />
                  </div>
                </div>
              </div>
              <div className="spine spine-right" aria-hidden="true">
                Credits &amp; Sponsors
              </div>
            </section>
          </div>

          {/* Identity page — always the bottom half */}
          <section className="page-bottom">
            <div className="watermark-seal" aria-hidden="true" />

            <div className="id-head">
              <div className="id-brand">
                <div className="brand-sub">
                  Codechella Passport · {data.location} · {data.eventDate}
                </div>
              </div>
              <div className="serial">{data.passportNumber}</div>
            </div>

            <div className="id-body">
              <div className="photo-col">
                <div className="photo">
                  <div className="photo-art" aria-hidden="true">
                    <img src={photoSrc} alt="" />
                  </div>
                </div>
              </div>

              <div className="identity">
                <div
                  className={`identity-names${stackNames ? " identity-names--stacked" : ""}`}
                >
                  <IdentityRow label="First name" value={data.firstName} />
                  <IdentityRow label="Last name" value={data.lastName} />
                </div>
                <IdentityRow label="Based in" value={data.location} />
                <IdentityRow label="Role" value="Organizer" />
                <IdentityRow
                  label="LinkedIn"
                  value={socialHandle(data.linkedin, "alhwyn")}
                  href={data.linkedin || undefined}
                />
                <IdentityRow
                  label="Twitter"
                  value={socialHandle(data.twitter, "@alhwynn")}
                  href={data.twitter || undefined}
                />
                <IdentityRow
                  label="GitHub"
                  value={socialHandle(data.github, "@alhwyn")}
                  href={data.github || undefined}
                />
              </div>
            </div>

            <div className="mrz">
              <div>{mrz1}</div>
              <div>{mrz2}</div>
            </div>
          </section>
        </div>
      </div>

      <div className="actions">
        <p className="meta">
          Codechella Hackathon · {data.location} · {data.eventDate}
          {" · "}
          <a href="/guests" style={{ color: "inherit" }}>
            Guests
          </a>
        </p>
      </div>
    </div>
  );
}
