/**
 * apiGuard.ts — Shared helpers for scan infrastructure safety
 *
 * 1. acquireScanLock / releaseScanLock — atomic DB-level lock via UPDATE+WHERE
 * 2. checkDailyBudget — call ONCE at function start, not per-request
 * 3. trackedApiFetch — safe fetch with timeout + fire-and-forget logging
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_DAILY_CALLS = 5000;

// ─── Scan Lock ───────────────────────────────────────────────

/**
 * Atomically acquire a scan lock on a profile.
 * Uses a single UPDATE with WHERE conditions — if two functions race,
 * only one UPDATE will match (the other gets 0 rows back).
 */
export async function acquireScanLock(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  functionName: string,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();

  const { data } = await supabase
    .from("tracked_profiles")
    .update({
      last_scan_started_at: new Date().toISOString(),
      last_scan_function: functionName,
    })
    .eq("id", profileId)
    .or(`last_scan_started_at.is.null,last_scan_started_at.lt.${cutoff}`)
    .select("id");

  return (data?.length ?? 0) > 0;
}

export async function releaseScanLock(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
): Promise<void> {
  await supabase
    .from("tracked_profiles")
    .update({
      last_scan_started_at: null,
      last_scan_function: null,
    })
    .eq("id", profileId);
}

// ─── Daily Budget ────────────────────────────────────────────

/**
 * Check daily API budget. Call ONCE at function start.
 * Returns { allowed: boolean, used: number, limit: number }.
 */
export async function checkDailyBudget(
  supabase: ReturnType<typeof createClient>,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  let maxCalls = DEFAULT_MAX_DAILY_CALLS;
  try {
    const envMax = Deno.env.get("MAX_DAILY_API_CALLS");
    if (envMax) maxCalls = parseInt(envMax, 10) || DEFAULT_MAX_DAILY_CALLS;
  } catch { /* use default */ }

  const { data, error } = await supabase.rpc("get_daily_api_calls");
  const used = error ? 0 : (data as number) ?? 0;

  return { allowed: used < maxCalls, used, limit: maxCalls };
}

// ─── API Call Logging (fire-and-forget) ──────────────────────

function logApiCall(
  supabase: ReturnType<typeof createClient>,
  functionName: string,
  profileId: string | null,
  endpoint: string,
  statusCode: number | null,
  responseTimeMs: number,
  errorMessage: string | null,
): void {
  // Fire-and-forget — don't block the scan
  supabase
    .from("api_call_log")
    .insert({
      function_name: functionName,
      profile_id: profileId,
      endpoint,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
    })
    .then(({ error }) => {
      if (error) console.warn("[apiGuard] log insert failed:", error.message);
    });
}

// ─── Safe Fetch with Timeout ─────────────────────────────────

/**
 * Fetch with AbortController timeout. No retries (caller decides).
 */
export async function safeApiFetch(
  url: string,
  headers: Record<string, string>,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Tracked API Fetch (log + fetch) ─────────────────────────

export interface TrackedFetchResult {
  response: Response | null;
  skipped: boolean; // true if 429 → caller should skip this profile
  error: string | null;
}

/**
 * Fetch a HikerAPI endpoint with logging.
 * - Logs every call (fire-and-forget)
 * - On 429: returns skipped=true (caller skips profile, no retry)
 * - On timeout/network error: returns error string
 */
export async function trackedApiFetch(
  supabase: ReturnType<typeof createClient>,
  functionName: string,
  profileId: string | null,
  url: string,
  headers: Record<string, string>,
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<TrackedFetchResult> {
  const start = Date.now();
  try {
    const res = await safeApiFetch(url, headers, timeoutMs);
    const elapsed = Date.now() - start;

    // Fire-and-forget log
    logApiCall(supabase, functionName, profileId, url, res.status, elapsed, null);

    if (res.status === 429) {
      console.warn(`[${functionName}] 429 rate-limited on ${url}`);
      return { response: null, skipped: true, error: null };
    }

    return { response: res, skipped: false, error: null };
  } catch (err) {
    const elapsed = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);

    logApiCall(supabase, functionName, profileId, url, null, elapsed, msg);

    return { response: null, skipped: false, error: msg };
  }
}
