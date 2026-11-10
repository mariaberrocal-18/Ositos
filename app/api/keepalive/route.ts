import type { NextRequest } from "next/server";

/**
 * Daily ping (Vercel Cron, see vercel.json) so the free Supabase project never
 * looks inactive and gets paused. It updates a one-row heartbeat table through an RPC;
 * no medical data is read or returned.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "missing env" }, { status: 500 });
  // A real write (RPC that bumps a one-row heartbeat table), plus an auth health
  // check, so Supabase sees genuine database and API activity every day.
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const res = await fetch(`${url}/rest/v1/rpc/keepalive`, { method: "POST", headers, body: "{}", cache: "no-store" });
  await fetch(`${url}/auth/v1/health`, { headers, cache: "no-store" }).catch(() => {});
  return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() }, { status: res.ok ? 200 : 502 });
}
