/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "npm:@react-email/components@0.0.22";

interface InviteEmailProps {
  confirmationUrl: string;
  siteName?: string;
}

export const InviteEmail = ({
  confirmationUrl = "https://spy-secret.com",
  siteName = "Spy-Secret",
}: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Du wurdest zu {siteName} eingeladen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={brandText}>
            <span style={{ color: "#ffffff" }}>Spy</span>
            <span style={{ color: "#FF2D78" }}>Secret</span>
          </Text>
        </Section>

        <Heading style={heading}>Du bist eingeladen! 🕵️</Heading>
        <Text style={paragraph}>
          Jemand hat dich zu {siteName} eingeladen. Klicke auf den Button, um loszulegen.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Einladung annehmen
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          © {new Date().getFullYear()} {siteName} · Dein geheimer Agent
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InviteEmail;

const main: React.CSSProperties = { backgroundColor: "#ffffff", fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" };
const container: React.CSSProperties = { margin: "0 auto", padding: "40px 24px", maxWidth: "480px" };
const logoSection: React.CSSProperties = { textAlign: "center" as const, marginBottom: "32px" };
const brandText: React.CSSProperties = { fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", backgroundColor: "#000000", padding: "16px 24px", borderRadius: "16px", display: "inline-block" };
const heading: React.CSSProperties = { fontSize: "24px", fontWeight: 700, color: "#000000", textAlign: "center" as const, margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "24px", color: "#555555", textAlign: "center" as const, margin: "0 0 24px" };
const buttonContainer: React.CSSProperties = { textAlign: "center" as const, margin: "0 0 24px" };
const button: React.CSSProperties = { backgroundColor: "#FF2D78", color: "#ffffff", fontSize: "15px", fontWeight: 700, borderRadius: "20px", padding: "14px 32px", textDecoration: "none", display: "inline-block" };
const hr: React.CSSProperties = { borderColor: "#e5e5e5", margin: "32px 0 16px" };
const footer: React.CSSProperties = { fontSize: "12px", color: "#8c8c8c", textAlign: "center" as const, margin: "0" };
