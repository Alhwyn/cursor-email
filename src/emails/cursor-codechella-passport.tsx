import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import { buildPassportUrl, defaultPassportData } from "../passport/passportData";

export interface CursorCodechellaPassportProps {
  firstName?: string;
  lastName?: string;
  eventName?: string;
  location?: string;
  eventDate?: string;
  /** Full URL to this person's React passport page. */
  passportUrl?: string;
  ctaLabel?: string;
}

const FONT =
  "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const PASSPORT_BASE_URL = "http://localhost:3010/";

export function CursorCodechellaPassport({
  firstName = defaultPassportData.firstName,
  lastName = defaultPassportData.lastName,
  eventName = "Codechella Hackathon",
  location = defaultPassportData.location,
  eventDate = defaultPassportData.eventDate,
  passportUrl,
  ctaLabel = "Open your passport",
}: CursorCodechellaPassportProps) {
  const href =
    passportUrl ??
    buildPassportUrl(PASSPORT_BASE_URL, {
      firstName,
      lastName,
      location,
      eventDate,
    });
  const previewText = `${firstName} ${lastName}, your ${eventName} passport for ${location} is ready.`;

  return (
    <Html lang="en">
      <Head>
        <title>{`${eventName} passport`}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={card}>
          <Section style={header}>
            <Text style={eyebrow}>CURSOR · {location.toUpperCase()}</Text>
            <Text style={title}>Codechella</Text>
            <Text style={subtitle}>Hackathon</Text>
          </Section>

          <Hr style={rule} />

          <Section style={body}>
            <Text style={greeting}>Hi {firstName},</Text>
            <Text style={paragraph}>
              Your Codechella passport is ready. Open it to see your credential
              for {location} — then share it with builders who should be in the
              room.
            </Text>
            <Text style={meta}>
              {eventName}
              <br />
              {location} · {eventDate}
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={href} style={button}>
              {ctaLabel}
            </Button>
            <Text style={footnote}>
              Event credential — not a travel document
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  margin: 0,
  padding: "32px 12px",
  backgroundColor: "#eceae4",
  fontFamily: FONT,
  color: "#171717",
} as const;

const card = {
  maxWidth: "440px",
  margin: "0 auto",
  backgroundColor: "#fcfcf9",
  border: "1px solid #e4e0d8",
  borderRadius: "12px",
  overflow: "hidden",
} as const;

const header = {
  padding: "28px 28px 20px",
} as const;

const eyebrow = {
  margin: "0 0 14px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.14em",
  color: "#f54e00",
  fontFamily: FONT,
} as const;

const title = {
  margin: 0,
  fontSize: "32px",
  lineHeight: 1.05,
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#171717",
  fontFamily: FONT,
} as const;

const subtitle = {
  margin: "2px 0 0",
  fontSize: "32px",
  lineHeight: 1.05,
  fontWeight: 500,
  letterSpacing: "-0.03em",
  color: "#a3a3a3",
  fontFamily: FONT,
} as const;

const rule = {
  borderColor: "#ebe7df",
  borderTop: "1px solid #ebe7df",
  margin: "0 28px",
} as const;

const body = {
  padding: "22px 28px 8px",
} as const;

const greeting = {
  margin: "0 0 10px",
  fontSize: "16px",
  fontWeight: 600,
  color: "#171717",
  fontFamily: FONT,
} as const;

const paragraph = {
  margin: "0 0 16px",
  fontSize: "15px",
  lineHeight: 1.55,
  color: "#52525b",
  fontFamily: FONT,
} as const;

const meta = {
  margin: 0,
  fontSize: "13px",
  lineHeight: 1.5,
  color: "#8a847a",
  fontFamily: FONT,
} as const;

const ctaSection = {
  padding: "20px 28px 28px",
  textAlign: "center" as const,
} as const;

const button = {
  display: "inline-block",
  backgroundColor: "#171717",
  color: "#fcfcf9",
  fontSize: "14px",
  fontWeight: 500,
  textDecoration: "none",
  padding: "12px 20px",
  borderRadius: "8px",
  fontFamily: FONT,
} as const;

const footnote = {
  margin: "14px 0 0",
  fontSize: "11px",
  color: "#a8a29a",
  fontFamily: FONT,
} as const;

export default CursorCodechellaPassport;

CursorCodechellaPassport.PreviewProps = {
  firstName: "Alhwyn",
  lastName: "Geonzon",
  eventName: "Codechella Hackathon",
  location: "Victoria, BC",
  eventDate: "22 Aug 2026",
  passportUrl: buildPassportUrl(PASSPORT_BASE_URL),
  ctaLabel: "Open your passport",
} satisfies CursorCodechellaPassportProps;
