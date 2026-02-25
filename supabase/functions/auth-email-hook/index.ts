import { sendLovableEmail } from "@lovable.dev/email-js";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { Webhook } from "npm:standardwebhooks@1.0.0";
import { SignupEmail } from "../_shared/email-templates/signup.tsx";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";
import { MagicLinkEmail } from "../_shared/email-templates/magic-link.tsx";
import { EmailChangeEmail } from "../_shared/email-templates/email-change.tsx";
import { ReauthenticationEmail } from "../_shared/email-templates/reauthentication.tsx";

const SITE_NAME = "Spy-Secret";
const SITE_URL = "https://spy-secret.com";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    if (!hookSecret) {
      throw new Error("SEND_EMAIL_HOOK_SECRET not configured");
    }

    // Verify Supabase Standard Webhook signature
    const body = await req.text();
    const wh = new Webhook(hookSecret);
    const headers: Record<string, string> = {};
    headers["webhook-id"] = req.headers.get("webhook-id") || "";
    headers["webhook-timestamp"] = req.headers.get("webhook-timestamp") || "";
    headers["webhook-signature"] = req.headers.get("webhook-signature") || "";

    const payload = wh.verify(body, headers) as {
      user: { email: string; id: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new?: string;
        token_hash_new?: string;
      };
    };

    const recipient = payload.user?.email ?? "";
    const emailAction = payload.email_data?.email_action_type ?? "";
    const token = payload.email_data?.token ?? "";
    const tokenHash = payload.email_data?.token_hash ?? "";
    const redirectTo = payload.email_data?.redirect_to || SITE_URL;
    const siteUrl = payload.email_data?.site_url || SITE_URL;

    // Build confirmation URL for link-based actions
    const confirmationUrl = `${siteUrl}/auth/confirm?token_hash=${tokenHash}&type=${emailAction}&redirect_to=${encodeURIComponent(redirectTo)}`;

    let subject = "";
    let html = "";

    switch (emailAction) {
      case "signup": {
        subject = `Dein Bestätigungscode – ${SITE_NAME}`;
        html = await renderAsync(
          SignupEmail({ token, siteName: SITE_NAME })
        );
        break;
      }
      case "recovery": {
        subject = `Passwort zurücksetzen – ${SITE_NAME}`;
        html = await renderAsync(
          RecoveryEmail({ confirmationUrl, siteName: SITE_NAME })
        );
        break;
      }
      case "invite": {
        subject = `Einladung zu ${SITE_NAME}`;
        html = await renderAsync(
          InviteEmail({ confirmationUrl, siteName: SITE_NAME })
        );
        break;
      }
      case "magic_link": {
        subject = `Dein Login-Link – ${SITE_NAME}`;
        html = await renderAsync(
          MagicLinkEmail({ confirmationUrl, siteName: SITE_NAME })
        );
        break;
      }
      case "email_change": {
        subject = `E-Mail-Änderung bestätigen – ${SITE_NAME}`;
        html = await renderAsync(
          EmailChangeEmail({ confirmationUrl, siteName: SITE_NAME })
        );
        break;
      }
      case "reauthentication": {
        subject = `Bestätigungscode – ${SITE_NAME}`;
        html = await renderAsync(
          ReauthenticationEmail({ token, siteName: SITE_NAME })
        );
        break;
      }
      default: {
        console.warn(`Unknown email action: ${emailAction}`);
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Send via Lovable Email API
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    await sendLovableEmail(
      {
        run_id: crypto.randomUUID(),
        to: recipient,
        from: `Spy-Secret <noreply@spy-secret.com>`,
        subject,
        html,
        text: subject,
        purpose: "transactional",
      },
      { apiKey, apiBaseUrl: "https://api.lovable.dev" },
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Auth email hook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
