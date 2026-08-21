/**
 * Parse a guest CSV (Luma-ish or our own headers) into upsert payloads.
 * Never commit real guest CSVs.
 */

export type GuestCsvRow = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  ticketName: string;
  city: string;
  company: string;
  building: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  passportUrl?: string;
  passportId?: string;
  photoUrl?: string;
  lumaGuestId?: string;
};

const HEADER_ALIASES: Record<keyof GuestCsvRow, string[]> = {
  email: ["email", "e-mail", "guest email", "attendee email"],
  name: ["name", "full name", "guest name", "attendee name"],
  firstName: ["firstname", "first name", "first_name", "given name"],
  lastName: ["lastname", "last name", "last_name", "surname", "family name"],
  ticketName: [
    "ticketname",
    "ticket name",
    "ticket",
    "ticket type",
    "ticket_type",
    "tier",
  ],
  city: ["city", "location", "based in", "based_in"],
  company: ["company", "organization", "org", "affiliation"],
  building: [
    "building",
    "building what",
    "project",
    "what are you building",
    "what_building",
  ],
  linkedin: ["linkedin", "linkedin url", "linkedin_url"],
  twitter: ["twitter", "x", "x url", "twitter url", "twitter_url"],
  github: ["github", "github url", "github_url"],
  passportUrl: ["passporturl", "passport url", "passport_url", "passport link"],
  passportId: ["passportid", "passport id", "passport_id", "uuid", "id"],
  photoUrl: ["photourl", "photo url", "photo_url", "photo", "avatar", "image"],
  lumaGuestId: [
    "lumaguestid",
    "luma guest id",
    "luma_guest_id",
    "guest id",
    "luma id",
  ],
};

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function mapHeaders(headers: string[]): Partial<Record<keyof GuestCsvRow, number>> {
  const map: Partial<Record<keyof GuestCsvRow, number>> = {};
  const normalized = headers.map(normalizeHeader);

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
    [keyof GuestCsvRow, string[]]
  >) {
    const idx = normalized.findIndex(h => aliases.includes(h));
    if (idx >= 0) map[field] = idx;
  }

  return map;
}

function cell(
  cells: string[],
  index: number | undefined,
): string | undefined {
  if (index === undefined) return undefined;
  const value = cells[index]?.trim();
  return value ? value : undefined;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

function newPassportId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Build a same-origin passport URL for a UUID when the CSV has no passportUrl.
 */
export function defaultPassportUrl(passportId: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/${passportId}`;
  }
  return `http://localhost:3010/${passportId}`;
}

export function parseGuestsCsv(text: string): GuestCsvRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV needs a header row and at least one guest row.");
  }

  const headers = splitCsvLine(lines[0]!);
  const col = mapHeaders(headers);

  if (col.email === undefined) {
    throw new Error(
      'CSV must include an "email" column (or "Guest Email" / "E-mail").',
    );
  }

  const guests: GuestCsvRow[] = [];

  for (let row = 1; row < lines.length; row++) {
    const cells = splitCsvLine(lines[row]!);
    const email = cell(cells, col.email)?.toLowerCase();
    if (!email) continue;

    const rawName = cell(cells, col.name) ?? "";
    const split = splitName(rawName);
    const firstName = cell(cells, col.firstName) ?? split.firstName;
    const lastName = cell(cells, col.lastName) ?? split.lastName;
    const name =
      rawName ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      email;

    const passportId = cell(cells, col.passportId) ?? newPassportId();
    const passportUrl =
      cell(cells, col.passportUrl) ?? defaultPassportUrl(passportId);

    guests.push({
      email,
      name,
      firstName: firstName || name,
      lastName,
      ticketName: cell(cells, col.ticketName) ?? "Standard",
      city: cell(cells, col.city) ?? "",
      company: cell(cells, col.company) ?? "",
      building: cell(cells, col.building) ?? "",
      linkedin: cell(cells, col.linkedin),
      twitter: cell(cells, col.twitter),
      github: cell(cells, col.github),
      passportUrl,
      passportId,
      photoUrl: cell(cells, col.photoUrl),
      lumaGuestId: cell(cells, col.lumaGuestId),
    });
  }

  if (guests.length === 0) {
    throw new Error("No guest rows with an email address were found.");
  }

  return guests;
}
