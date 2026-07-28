import { useEffect, useMemo, useState } from "react";
import {
  buildMrz,
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

export function PassportPage() {
  const [data, setData] = useState<PassportData>(() =>
    readPassportFromSearch(window.location.search),
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      setData(readPassportFromSearch(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.title = `${data.firstName} ${data.lastName} · Codechella Passport`;
  }, [data.firstName, data.lastName]);

  const [mrz1, mrz2] = useMemo(() => buildMrz(), []);

  function toggleOpen() {
    setIsOpen((open) => !open);
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
                  <img
                    className="sponsor-banner"
                    src="/assets/sponsors/logos-top.png"
                    alt="Sponsors: Convex, Ship-a-ton, UVEC, GMI"
                    draggable={false}
                  />
                  <img
                    className="sponsor-banner"
                    src="/assets/sponsors/logos-bottom.png"
                    alt="Sponsors: Solana, ElevenLabs, Exa, Render, Firecrawl, Wispr Flow"
                    draggable={false}
                  />
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
                  <div className="photo-art" aria-hidden="true" />
                </div>
              </div>

              <div className="identity">
                <IdentityRow label="Last name" value={data.lastName} />
                <IdentityRow label="First name" value={data.firstName} />
                <IdentityRow label="Based in" value={data.location} />
                <IdentityRow
                  label="LinkedIn"
                  value={socialHandle(data.linkedin, "alhwyn")}
                  href={data.linkedin}
                />
                <IdentityRow
                  label="Twitter"
                  value={socialHandle(data.twitter, "@alhwynn")}
                  href={data.twitter}
                />
                <IdentityRow
                  label="GitHub"
                  value={socialHandle(data.github, "@alhwyn")}
                  href={data.github}
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
        </p>
      </div>
    </div>
  );
}
