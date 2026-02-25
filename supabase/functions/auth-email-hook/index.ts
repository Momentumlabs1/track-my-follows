import { Webhook } from "@lovable.dev/webhooks-js";
import { Resend } from "@lovable.dev/email-js";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { SignupEmail } from "../_shared/email-templates/signup.tsx";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";
import { MagicLinkEmail } from "../_shared/email-templates/magic-link.tsx";
import { EmailChangeEmail } from "../_shared/email-templates/email-change.tsx";
import { ReauthenticationEmail } from "../_shared/email-templates/reauthentication.tsx";

const SITE_NAME = "Spy-Secret";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const webhookSecret = Deno.env.get("LOVABLE_API_KEY");
    if (!webhookSecret) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const wh = new Webhook(webhookSecret);
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => (headers[k] = v));

    const payload = wh.verify(body, headers) as any;

    const { email_data, email_action } = payload;
    const { token, token_hash, redirect_to, email_change_new } = email_data || {};
    const recipient = email_data?.email || "";
    const confirmationUrl = email_data?.confirmation_url || redirect_to || "";

    let subject = "";
    let html = "";

    switch (email_action?.action) {
      case "signup": {
        subject = `Dein Bestätigungscode – ${SITE_NAME}`;
        html = await renderAsync(
          SignupEmail({ token: token || token_hash || "", siteName: SITE_NAME })
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
          ReauthenticationEmail({ token: token || token_hash || "", siteName: SITE_NAME })
        );
        break;
      }
      default: {
        console.warn(`Unknown email action: ${email_action?.action}`);
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Send email via Lovable email API
    const callbackUrl = email_action?.callback_url;
    if (!callbackUrl) {
      throw new Error("No callback_url in payload");
    }

    const resend = new Resend(webhookSecret);
    await resend.emails.send(
      {
        from: `Spy-Secret <noreply@notify.spy-secret.com>`,
        to: [recipient],
        subject,
        html,
      },
      { callbackUrl }
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
