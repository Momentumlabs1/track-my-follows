/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "npm:@react-email/components@0.0.22";

interface ReauthenticationEmailProps {
  token: string;
  siteName?: string;
}

export const ReauthenticationEmail = ({
  token = "000000",
  siteName = "Spy-Secret",
}: ReauthenticationEmailProps) => (
  <Html>
    <Head />
    <Preview>Dein Bestätigungscode – {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={brandText}>
            <span style={{ color: "#ffffff" }}>Spy</span>
            <span style={{ color: "#FF2D78" }}>Secret</span>
          </Text>
        </Section>

        <Heading style={heading}>Identität bestätigen</Heading>
        <Text style={paragraph}>
          Gib diesen Code ein, um die Aktion zu bestätigen:
        </Text>

        <Section style={codeContainer}>
          <Text style={codeText}>{token}</Text>
        </Section>

        <Text style={paragraphSmall}>
          Der Code ist 60 Minuten gültig.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          © {new Date().getFullYear()} {siteName} · Dein geheimer Agent
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ReauthenticationEmail;

const main: React.CSSProperties = { backgroundColor: "#ffffff", fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" };
const container: React.CSSProperties = { margin: "0 auto", padding: "40px 24px", maxWidth: "480px" };
const logoSection: React.CSSProperties = { textAlign: "center" as const, marginBottom: "32px" };
const brandText: React.CSSProperties = { fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", backgroundColor: "#000000", padding: "16px 24px", borderRadius: "16px", display: "inline-block" };
const heading: React.CSSProperties = { fontSize: "24px", fontWeight: 700, color: "#000000", textAlign: "center" as const, margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "24px", color: "#555555", textAlign: "center" as const, margin: "0 0 24px" };
const paragraphSmall: React.CSSProperties = { fontSize: "13px", lineHeight: "20px", color: "#8c8c8c", textAlign: "center" as const, margin: "0 0 24px" };
const codeContainer: React.CSSProperties = { background: "linear-gradient(135deg, #FF2D78, #FF6BA0)", borderRadius: "16px", padding: "24px", textAlign: "center" as const, margin: "0 0 24px" };
const codeText: React.CSSProperties = { fontSize: "36px", fontWeight: 800, color: "#ffffff", letterSpacing: "8px", margin: "0" };
const hr: React.CSSProperties = { borderColor: "#e5e5e5", margin: "32px 0 16px" };
const footer: React.CSSProperties = { fontSize: "12px", color: "#8c8c8c", textAlign: "center" as const, margin: "0" };
