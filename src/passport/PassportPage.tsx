import { useEffect, useMemo, useState } from "react";
import {
  buildMrz,
  readPassportFromSearch,
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
  const [copied, setCopied] = useState(false);
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

  const [mrz1, mrz2] = useMemo(() => buildMrz(data), [data]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this passport link:", window.location.href);
    }
  }

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
              <div className="spine">Credits &amp; Sponsors</div>
              <div className="page-top-main">
                <div className="header">
                  <div className="dots">
                    <span className="dot green" />
                    <span className="dot blue" />
                  </div>
                  <h1 className="event-title">{data.eventTitle}</h1>
                </div>
                <div className="sticker-slot" aria-label="Sticker area" />
              </div>
            </section>
          </div>

          {/* Identity page — always the bottom half */}
          <section className="page-bottom">
            <img
              className="watermark-building"
              src="/assets/victoria-parliament-watermark.png"
              alt=""
              width={200}
              height={117}
            />
            <div className="watermark-seal" aria-hidden="true" />

            <div className="id-head">
              <div className="id-brand">
                <img
                  className="cursor-wordmark"
                  src="/assets/cursor-lockup-light.png"
                  alt="Cursor"
                  width={120}
                  height={28}
                />
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
                  <div className="photo-code">
                    <div className="qr" />
                  </div>
                </div>
                <div className="photo-caption">Photo</div>
              </div>

              <div className="identity">
                <IdentityRow label="Last name" value={data.lastName} />
                <IdentityRow label="First name" value={data.firstName} />
                <IdentityRow label="Based in" value={data.location} />
              </div>

              <div className="holo" aria-hidden="true" />
            </div>

            <div className="mrz">
              <div>{mrz1}</div>
              <div>{mrz2}</div>
            </div>
          </section>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="share" onClick={handleShare}>
          {copied ? "Link copied" : "Share your passport"}
        </button>
        <p className="meta">
          Codechella Hackathon · {data.location} · {data.eventDate}
        </p>
      </div>
    </div>
  );
}
