import { parseEmailWebhookPayload, sendLovableEmail } from "@lovable.dev/email-js";
import { verifyWebhookRequest, type EmailWebhookPayload } from "@lovable.dev/webhooks-js";
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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { body } = await verifyWebhookRequest<EmailWebhookPayload>({
      req,
      secret: apiKey,
    });

    const payload = parseEmailWebhookPayload(body);
    if (payload.version !== "1") {
      throw new Error(`Unsupported payload version: ${payload.version}`);
    }
    if (!payload.run_id) {
      throw new Error("Missing run_id");
    }

    const apiBaseUrl = payload.data?.api_base_url ?? "https://api.lovable.dev";
    const recipient = payload.data?.email ?? "";
    const token = payload.data?.token ?? "";
    const confirmationUrl = payload.data?.confirmation_url ?? "";
    const emailAction = payload.data?.email_action_type ?? "";

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

    await sendLovableEmail(
      {
        run_id: payload.run_id,
        to: recipient,
        from: `Spy-Secret <noreply@spy-secret.com>`,
        subject,
        html,
        text: subject,
        purpose: "transactional",
      },
      { apiKey, apiBaseUrl },
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
