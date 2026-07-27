import { useEffect, useMemo, useState } from "react";
import {
  buildMrz,
  readPassportFromSearch,
  type PassportData,
} from "./passportData";
import "./passport.css";

type Sticker = {
  src: string;
  alt: string;
  rotate: number;
  top: string;
  left: string;
  z: number;
  width: number;
};

const SPONSOR_STICKERS: Sticker[] = [
  {
    src: "/assets/sponsors/convex.png",
    alt: "Convex",
    rotate: -14,
    top: "6%",
    left: "2%",
    z: 3,
    width: 150,
  },
  {
    src: "/assets/sponsors/shipaton.png",
    alt: "Ship-a-ton",
    rotate: 8,
    top: "2%",
    left: "28%",
    z: 7,
    width: 190,
  },
  {
    src: "/assets/sponsors/firecrawl.png",
    alt: "Firecrawl",
    rotate: -5,
    top: "8%",
    left: "62%",
    z: 4,
    width: 152,
  },
  {
    src: "/assets/sponsors/exa.png",
    alt: "Exa",
    rotate: 18,
    top: "24%",
    left: "38%",
    z: 9,
    width: 96,
  },
  {
    src: "/assets/sponsors/wispr-flow.png",
    alt: "Wispr Flow",
    rotate: -10,
    top: "36%",
    left: "4%",
    z: 5,
    width: 164,
  },
  {
    src: "/assets/sponsors/gmi.png",
    alt: "GMI",
    rotate: 9,
    top: "30%",
    left: "52%",
    z: 8,
    width: 136,
  },
  {
    src: "/assets/sponsors/render.png",
    alt: "Render",
    rotate: -13,
    top: "54%",
    left: "16%",
    z: 6,
    width: 144,
  },
  {
    src: "/assets/sponsors/elevenlabs.png",
    alt: "ElevenLabs",
    rotate: 12,
    top: "50%",
    left: "46%",
    z: 4,
    width: 170,
  },
  {
    src: "/assets/sponsors/solana.png",
    alt: "Solana",
    rotate: -8,
    top: "68%",
    left: "28%",
    z: 7,
    width: 172,
  },
];

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
              <div className="spine">Credits &amp; Sponsors</div>
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
                <div className="sticker-field" aria-label="Sponsor stickers">
                  {SPONSOR_STICKERS.map((sticker, index) => (
                    <div
                      key={`${sticker.alt}-${index}`}
                      className="sticker"
                      style={{
                        top: sticker.top,
                        left: sticker.left,
                        zIndex: sticker.z,
                        width: sticker.width,
                        transform: `rotate(${sticker.rotate}deg)`,
                      }}
                    >
                      <img src={sticker.src} alt={sticker.alt} draggable={false} />
                    </div>
                  ))}
                </div>
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
                </div>
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
        <p className="meta">
          Codechella Hackathon · {data.location} · {data.eventDate}
        </p>
      </div>
    </div>
  );
}
