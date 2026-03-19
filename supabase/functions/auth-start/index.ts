import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, deeplink_scheme } = await req.json();

    if (!provider || !deeplink_scheme) {
      return new Response(
        JSON.stringify({ error: 'provider and deeplink_scheme required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    // Redirect to /native-callback so we can close the browser session via deeplink
    const redirectUrl = `https://track-my-follows.lovable.app/native-callback?deeplink_scheme=${encodeURIComponent(deeplink_scheme)}`;

    const params = new URLSearchParams({
      provider,
      redirect_to: redirectUrl,
      scopes: 'openid email profile',
      flow_type: 'implicit',
    });

    const oauthUrl = `${supabaseUrl}/auth/v1/authorize?${params}`;

    return new Response(
      JSON.stringify({ url: oauthUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
