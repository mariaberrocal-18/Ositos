import type { NextRequest } from "next/server";

/**
 * Daily ping (Vercel Cron, see vercel.json) so the free Supabase project never
 * looks inactive and gets paused. It runs one tiny query through the REST API.
 * RLS returns no rows to this anonymous request, so no medical data leaves the DB.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "missing env" }, { status: 500 });
  const res = await fetch(`${url}/rest/v1/pets?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() }, { status: res.ok ? 200 : 502 });
}
