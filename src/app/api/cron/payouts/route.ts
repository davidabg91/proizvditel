import { NextResponse } from "next/server";
import { payoutDueOrders } from "@/lib/payout";

/**
 * Ежедневно изплащане към производителите — за поръчките, отбелязани като
 * доставени, чийто срок за рекламации е изтекъл (виж lib/payout.ts).
 * Извиква се от Vercel Cron с `Authorization: Bearer $CRON_SECRET`.
 */

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Няма достъп." }, { status: 401 });
  }

  const result = await payoutDueOrders();
  console.log("cron/payouts:", result);
  return NextResponse.json(result, { status: result.failed.length ? 500 : 200 });
}
