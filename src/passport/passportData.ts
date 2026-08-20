export type PassportRole = "Builder" | "Guest" | "Organizer";

export interface PassportData {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  companyUrl: string;
  passportNumber: string;
  issueDate: string;
  eventDate: string;
  stampDate: string;
  location: string;
  /** Attendee role: Builder, Guest, or Organizer */
  accessTier: PassportRole;
  entries: string;
  authority: string;
  eventTitle: string;
  linkedin: string;
  twitter: string;
  github: string;
}

export function normalizeRole(value: string): PassportRole {
  const v = value.trim().toLowerCase();
  if (v === "guest") return "Guest";
  if (v === "builder") return "Builder";
  if (v === "organizer") return "Organizer";
  return "Organizer";
}

export const defaultPassportData: PassportData = {
  firstName: "Alhwyn",
  lastName: "Geonzon",
  title: "Founder",
  company: "Photobomb.online",
  companyUrl: "https://photobomb.online",
  passportNumber: "CURSOR2026001",
  issueDate: "27 JUL 2026",
  eventDate: "August 22nd",
  stampDate: "22 AUG\n2026",
  location: "Victoria, BC",
  accessTier: "Organizer" as PassportRole,
  entries: "Multiple (M)",
  authority: "Cursor Dept. of Events",
  eventTitle: "Codechella Victoria 2026",
  linkedin: "https://www.linkedin.com/in/alhwyn",
  twitter: "https://x.com/alhwynn",
  github: "https://github.com/alhwyn",
};

/** Short display handle for social IdentityRows. */
export function socialHandle(url: string, fallback: string): string {
  if (!url.trim()) return fallback;
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const segment = path.split("/").filter(Boolean).pop();
    if (!segment) return fallback;
    if (url.includes("linkedin.com")) return segment;
    return segment.startsWith("@") ? segment : `@${segment}`;
  } catch {
    return fallback;
  }
}

/** MRZ-style lines — event branding + filler numbers, padded to fill width. */
export function buildMrz(): [string, string] {
  const length = 72;
  const line1 = "P<CUR<<CURSOR<<CODECHELLA";
  const line2 = "84729163<CUR2608227M<<<<<<<291847630<<<<<<<0";
  return [
    (line1 + "<".repeat(length)).slice(0, length),
    (line2 + "<".repeat(length)).slice(0, length),
  ];
}

export function buildPassportUrl(
  baseUrl: string,
  data: Partial<PassportData> = defaultPassportData,
): string {
  const merged = { ...defaultPassportData, ...data };
  const params = new URLSearchParams({
    firstName: merged.firstName,
    lastName: merged.lastName,
    title: merged.title,
    company: merged.company,
    companyUrl: merged.companyUrl,
    passportNumber: merged.passportNumber,
    issueDate: merged.issueDate,
    eventDate: merged.eventDate,
    location: merged.location,
    accessTier: merged.accessTier,
    entries: merged.entries,
    authority: merged.authority,
    eventTitle: merged.eventTitle,
    linkedin: merged.linkedin,
    twitter: merged.twitter,
    github: merged.github,
  });
  return `${baseUrl}?${params.toString()}`;
}

export function readPassportFromSearch(search: string): PassportData {
  const params = new URLSearchParams(search);
  const next = { ...defaultPassportData };

  for (const key of Object.keys(defaultPassportData) as Array<keyof PassportData>) {
    const value = params.get(key);
    if (value) {
      if (key === "accessTier") {
        next.accessTier = normalizeRole(value);
      } else {
        next[key] = value;
      }
    }
  }

  // Force canonical event day (rewrites stale "14–16 Aug 2026" query params).
  const normalizedDate = next.eventDate.replace(/\s+/g, " ").trim();
  const isAug22 =
    /august\s*22(nd)?/i.test(normalizedDate) || /^22\s*aug/i.test(normalizedDate);
  if (!isAug22) {
    next.eventDate = defaultPassportData.eventDate;
  }

  if (!params.get("stampDate") || !/22/.test(next.stampDate)) {
    next.stampDate = "22 AUG\n2026";
  }

  // Canonical role for this passport (URL often still has stale accessTier=Builder).
  next.accessTier = "Organizer";

  // Canonical serial (rewrites short/stale CUR2026001 / CURSORVIC… query values).
  if (
    !next.passportNumber ||
    /^CUR\d/i.test(next.passportNumber) ||
    /^CURSORVIC/i.test(next.passportNumber)
  ) {
    next.passportNumber = defaultPassportData.passportNumber;
  }

  return next;
}
