/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from "npm:@react-email/components@0.0.22";

interface SignupEmailProps {
  token: string;
  siteName?: string;
  siteUrl?: string;
}

const LOGO_URL = "https://track-my-follows.lovable.app/email-logo.png";

export const SignupEmail = ({
  token = "000000",
  siteName = "Spy-Secret",
  siteUrl = "https://spy-secret.com",
}: SignupEmailProps) => (
  <Html>
    <Head />
    <Preview>Dein Bestätigungscode für {siteName}</Preview>
    <Body style={main}>
      <Container style={outerContainer}>
        <Section style={card}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} alt={siteName} width="180" style={logoImg} />
          </Section>

          <Hr style={divider} />

          <Heading style={heading}>Bestätige deine E-Mail</Heading>
          <Text style={paragraph}>
            Gib diesen Code in der App ein, um dein Konto zu aktivieren:
          </Text>

          <Section style={codeContainer}>
            <Text style={codeText}>{token}</Text>
          </Section>

          <Text style={paragraphSmall}>
            Der Code ist 10 Minuten gültig. Falls du dich nicht registriert hast,
            kannst du diese E-Mail ignorieren.
          </Text>

          <Hr style={divider} />

          <Text style={footerBrand}>🕵️ {siteName}</Text>
          <Text style={footerTagline}>Dein geheimer Agent</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default SignupEmail;

const main: React.CSSProperties = { backgroundColor: "#ffffff", fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" };
const outerContainer: React.CSSProperties = { backgroundColor: "#f4f4f5", padding: "40px 16px" };
const card: React.CSSProperties = { backgroundColor: "#ffffff", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "40px 32px", maxWidth: "480px", margin: "0 auto" };
const logoSection: React.CSSProperties = { textAlign: "center" as const, marginBottom: "8px" };
const logoImg: React.CSSProperties = { display: "inline-block" };
const divider: React.CSSProperties = { borderColor: "#e5e5e5", margin: "24px 0" };
const heading: React.CSSProperties = { fontSize: "24px", fontWeight: 700, color: "#000000", textAlign: "center" as const, margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "24px", color: "#555555", textAlign: "center" as const, margin: "0 0 24px" };
const paragraphSmall: React.CSSProperties = { fontSize: "13px", lineHeight: "20px", color: "#8c8c8c", textAlign: "center" as const, margin: "0 0 8px" };
const codeContainer: React.CSSProperties = { background: "linear-gradient(135deg, #FF2D78, #FF6BA0)", borderRadius: "16px", padding: "24px", textAlign: "center" as const, margin: "0 0 24px" };
const codeText: React.CSSProperties = { fontSize: "36px", fontWeight: 800, color: "#ffffff", letterSpacing: "8px", margin: "0" };
const footerBrand: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#000000", textAlign: "center" as const, margin: "0 0 4px" };
const footerTagline: React.CSSProperties = { fontSize: "12px", color: "#8c8c8c", textAlign: "center" as const, margin: "0" };
