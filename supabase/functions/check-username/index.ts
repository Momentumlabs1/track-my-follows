const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return new Response(JSON.stringify({ error: "username required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    const HIKER_API_KEY = Deno.env.get("HIKER_API_KEY");
    if (!HIKER_API_KEY) throw new Error("HIKER_API_KEY not configured");

    const url = `https://api.hikerapi.com/v1/user/by/username?username=${encodeURIComponent(cleanUsername)}`;
    const res = await fetch(url, {
      headers: { "x-access-key": HIKER_API_KEY },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return new Response(JSON.stringify({ exists: false, is_private: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await res.text();
      console.error("[check-username] HikerAPI error:", res.status, text);
      throw new Error(`HikerAPI error: ${res.status}`);
    }

    const data = await res.json();

    // HikerAPI returns user object or error
    if (!data || data.error || !data.pk) {
      return new Response(JSON.stringify({ exists: false, is_private: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      exists: true,
      is_private: !!data.is_private,
      pk: String(data.pk),
      avatar_url: data.profile_pic_url || null,
      full_name: data.full_name || null,
      follower_count: data.follower_count ?? null,
      following_count: data.following_count ?? null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[check-username] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
