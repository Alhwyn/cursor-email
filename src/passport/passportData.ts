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
  accessTier: string;
  entries: string;
  authority: string;
  eventTitle: string;
}

export const defaultPassportData: PassportData = {
  firstName: "Alhwyn",
  lastName: "Geonzon",
  title: "Founder",
  company: "Photobomb.online",
  companyUrl: "https://photobomb.online",
  passportNumber: "CURSORVIC2026001",
  issueDate: "27 JUL 2026",
  eventDate: "August 22nd",
  stampDate: "22 AUG\n2026",
  location: "Victoria, BC",
  accessTier: "Builder",
  entries: "Multiple (M)",
  authority: "Cursor Dept. of Events",
  eventTitle: "Codechella Victoria",
};

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
  });
  return `${baseUrl}?${params.toString()}`;
}

export function readPassportFromSearch(search: string): PassportData {
  const params = new URLSearchParams(search);
  const next = { ...defaultPassportData };

  for (const key of Object.keys(defaultPassportData) as Array<keyof PassportData>) {
    const value = params.get(key);
    if (value) {
      next[key] = value;
    }
  }

  if (!params.get("stampDate") && params.get("eventDate")) {
    // Keep a sensible stamp fallback when only eventDate is provided.
    next.stampDate = "22 AUG\n2026";
  }

  return next;
}
