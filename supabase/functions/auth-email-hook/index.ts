import { parseEmailWebhookPayload, sendLovableEmail } from "@lovable.dev/email-js";
import { verifyWebhookRequest, WebhookError } from "@lovable.dev/webhooks-js";
import type { EmailWebhookPayload } from "@lovable.dev/webhooks-js";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { SignupEmail } from "../_shared/email-templates/signup.tsx";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";
import { MagicLinkEmail } from "../_shared/email-templates/magic-link.tsx";
import { EmailChangeEmail } from "../_shared/email-templates/email-change.tsx";
import { ReauthenticationEmail } from "../_shared/email-templates/reauthentication.tsx";

const SITE_NAME = "Spy-Secret";
const SITE_URL = "https://spy-secret.com";

type LegacySupabasePayload = {
  user?: { email?: string; id?: string };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  };
};

function extractEmailData(payload: EmailWebhookPayload | LegacySupabasePayload) {
  if ("data" in payload && payload.data) {
    const data = payload.data;
    const actionType = String(data.action_type ?? "");
    const url = String(data.url ?? SITE_URL);
    return {
      runId: String(payload.run_id ?? data.run_id ?? ""),
      apiBaseUrl: String(data.api_base_url ?? "https://api.lovable.dev"),
      recipient: String(data.email ?? ""),
      actionType,
      token: String(data.token ?? ""),
      confirmationUrl: url,
    };
  }

  const legacy = payload as LegacySupabasePayload;
  const actionType = legacy.email_data?.email_action_type ?? "";
  const tokenHash = legacy.email_data?.token_hash ?? "";
  const redirectTo = legacy.email_data?.redirect_to || SITE_URL;
  const siteUrl = legacy.email_data?.site_url || SITE_URL;
  const confirmationUrl = `${siteUrl}/auth/confirm?token_hash=${tokenHash}&type=${actionType}&redirect_to=${encodeURIComponent(redirectTo)}`;

  return {
    runId: "",
    apiBaseUrl: "https://api.lovable.dev",
    recipient: legacy.user?.email ?? "",
    actionType,
    token: legacy.email_data?.token ?? "",
    confirmationUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawHookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET")?.trim();
    if (!rawHookSecret) {
      throw new Error("SEND_EMAIL_HOOK_SECRET not configured");
    }

    const secrets = rawHookSecret
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.startsWith("whsec_"));

    const { payload } = await verifyWebhookRequest<EmailWebhookPayload | LegacySupabasePayload>({
      req,
      secret: secrets[0] ?? rawHookSecret,
      signatureHeader: "webhook-signature",
      timestampHeader: "webhook-timestamp",
      parser: (body) => {
        try {
          return parseEmailWebhookPayload(body);
        } catch {
          return JSON.parse(body) as LegacySupabasePayload;
        }
      },
    });

    const { runId, apiBaseUrl, recipient, actionType, token, confirmationUrl } = extractEmailData(payload);

    const maskedEmail = recipient ? recipient.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "MISSING";
    console.log(`[auth-email-hook] actionType=${actionType} recipient=${maskedEmail} runId=${runId ? "present" : "MISSING"}`);

    if (!recipient) {
      throw new Error("Missing recipient email in webhook payload");
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let subject = "";
    let html = "";

    switch (actionType) {
      case "signup": {
        subject = `Dein Bestätigungscode – ${SITE_NAME}`;
        html = await renderAsync(SignupEmail({ token, siteName: SITE_NAME }));
        break;
      }
      case "recovery": {
        subject = `Passwort zurücksetzen – ${SITE_NAME}`;
        html = await renderAsync(RecoveryEmail({ confirmationUrl, siteName: SITE_NAME }));
        break;
      }
      case "invite": {
        subject = `Einladung zu ${SITE_NAME}`;
        html = await renderAsync(InviteEmail({ confirmationUrl, siteName: SITE_NAME }));
        break;
      }
      case "magiclink":
      case "magic_link": {
        subject = `Dein Login-Link – ${SITE_NAME}`;
        html = await renderAsync(MagicLinkEmail({ confirmationUrl, siteName: SITE_NAME }));
        break;
      }
      case "email_change": {
        subject = `E-Mail-Änderung bestätigen – ${SITE_NAME}`;
        html = await renderAsync(EmailChangeEmail({ confirmationUrl, siteName: SITE_NAME }));
        break;
      }
      case "reauthentication": {
        subject = `Bestätigungscode – ${SITE_NAME}`;
        html = await renderAsync(ReauthenticationEmail({ token, siteName: SITE_NAME }));
        break;
      }
      default: {
        console.warn(`Unknown email action: ${actionType}`);
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (!runId) {
      throw new Error("Missing run_id in webhook payload");
    }

    await sendLovableEmail(
      {
        run_id: runId,
        to: recipient,
        from: `Spy-Secret <noreply@notify.spy-secret.com>`,
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
    if (error instanceof WebhookError) {
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    console.error("Auth email hook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
