import { sendLovableEmail } from "@lovable.dev/email-js";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { SignupEmail } from "../_shared/email-templates/signup.tsx";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";
import { MagicLinkEmail } from "../_shared/email-templates/magic-link.tsx";
import { EmailChangeEmail } from "../_shared/email-templates/email-change.tsx";
import { ReauthenticationEmail } from "../_shared/email-templates/reauthentication.tsx";

const SITE_NAME = "Spy-Secret";
const SITE_URL = "https://spy-secret.com";

function extractEmailData(payload: Record<string, unknown>) {
  // Log full payload for debugging
  console.log("[auth-email-hook] Full payload:", JSON.stringify(payload));

  // Lovable webhook format: { data: { action_type, email, token, ... }, run_id }
  if (payload.data && typeof payload.data === "object") {
    const data = payload.data as Record<string, unknown>;
    return {
      runId: String(payload.run_id ?? data.run_id ?? ""),
      apiBaseUrl: String(data.api_base_url ?? "https://api.lovable.dev"),
      recipient: String(data.email ?? ""),
      actionType: String(data.action_type ?? ""),
      token: String(data.token ?? ""),
      confirmationUrl: String(data.url ?? SITE_URL),
    };
  }

  // Supabase Auth Hook format: { user: { email, id }, email_data: { token, token_hash, email_action_type, ... } }
  const user = payload.user as Record<string, unknown> | undefined;
  const emailData = payload.email_data as Record<string, unknown> | undefined;

  if (user || emailData) {
    const actionType = String(emailData?.email_action_type ?? "");
    const tokenHash = String(emailData?.token_hash ?? "");
    const token = String(emailData?.token ?? "");
    const redirectTo = String(emailData?.redirect_to || SITE_URL);
    const siteUrl = String(emailData?.site_url || SITE_URL);
    const confirmationUrl = `${siteUrl}/auth/confirm?token_hash=${tokenHash}&type=${actionType}&redirect_to=${encodeURIComponent(redirectTo)}`;

    return {
      runId: "",
      apiBaseUrl: "https://api.lovable.dev",
      recipient: String(user?.email ?? ""),
      actionType,
      token,
      confirmationUrl,
    };
  }

  // Unknown format - return what we can
  return {
    runId: "",
    apiBaseUrl: "https://api.lovable.dev",
    recipient: "",
    actionType: "",
    token: "",
    confirmationUrl: SITE_URL,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("[auth-email-hook] Received payload keys:", Object.keys(payload));

    // Supabase sometimes sends a ping/health check with just { type: "..." }
    // Return 200 so it doesn't block auth flow
    if (Object.keys(payload).length === 1 && "type" in payload && !("user" in payload) && !("data" in payload)) {
      console.log("[auth-email-hook] Health check or empty payload, returning 200");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { runId, apiBaseUrl, recipient, actionType, token, confirmationUrl } = extractEmailData(payload);

    const maskedEmail = recipient ? recipient.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "MISSING";
    console.log(`[auth-email-hook] actionType=${actionType} recipient=${maskedEmail} runId=${runId ? "present" : "MISSING"}`);

    if (!recipient) {
      // Don't throw - return 200 so Supabase doesn't block the signup
      console.warn("[auth-email-hook] No recipient found, returning 200 to not block auth");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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
        console.warn(`[auth-email-hook] Unknown email action: ${actionType}, returning 200`);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Send email via Lovable Email API
    // Both Lovable format (with run_id) and Supabase format (without run_id) use the same API
    console.log(`[auth-email-hook] Sending email to ${maskedEmail}, runId=${runId ? "present" : "none (Supabase format)"}`);
    
    try {
      await sendLovableEmail(
        {
          ...(runId ? { run_id: runId } : {}),
          to: recipient,
          from: `Spy-Secret <noreply@notify.spy-secret.com>`,
          subject,
          html,
          text: subject,
          purpose: "transactional",
        },
        { apiKey, apiBaseUrl },
      );
      console.log(`[auth-email-hook] Email sent successfully to ${maskedEmail}`);
    } catch (emailError) {
      console.error(`[auth-email-hook] Email send failed:`, emailError);
      // Still return 200 so Supabase auth flow is not blocked
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Auth email hook error:", error);
    // Return 200 even on error to not block auth flow
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
