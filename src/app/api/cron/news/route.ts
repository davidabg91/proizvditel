import { NextResponse } from "next/server";
import { collectNews } from "@/lib/news-ai";

/**
 * Седмично събиране на агро новини и събития.
 *
 * Извиква се от Vercel Cron (виж vercel.json). Vercel изпраща
 * `Authorization: Bearer $CRON_SECRET`, така че маршрутът не е публичен.
 */

export const runtime = "nodejs";
// Търсенето в мрежата отнема време — искаме дълъг таван.
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Няма достъп." }, { status: 401 });
  }

  const result = await collectNews();
  console.log("cron/news:", result);

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
