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
  passportNumber: "CUR2026001",
  issueDate: "27 JUL 2026",
  eventDate: "22 Aug 2026",
  stampDate: "22 AUG\n2026",
  location: "Victoria, BC",
  accessTier: "Builder",
  entries: "Multiple (M)",
  authority: "Cursor Dept. of Events",
  eventTitle: "Codechella 2026",
};

function padMrz(value: string, length: number): string {
  const cleaned = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "<")
    .replace(/<+/g, "<");
  return (cleaned + "<".repeat(length)).slice(0, length);
}

export function buildMrz(data: Pick<PassportData, "firstName" | "lastName" | "passportNumber">): [string, string] {
  const line1 = `P<CUR<${padMrz(data.lastName, 20)}${padMrz(data.firstName, 15)}`;
  const line2 = `${padMrz(data.passportNumber, 9)}CUR8505187M2608228${"<".repeat(15)}0`;
  return [line1.slice(0, 44), line2.slice(0, 44)];
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
