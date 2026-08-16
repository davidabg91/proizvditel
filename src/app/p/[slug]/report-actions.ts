"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ReportResult = { ok: true } | { ok: false; error: string };

export async function createReport(input: {
  targetType: string;
  targetId: string;
  targetLabel?: string;
  reason: string;
  note?: string;
}): Promise<ReportResult> {
  const session = await auth();
  if (!session?.user?.id)
    return { ok: false, error: "Влезте, за да докладвате." };

  const reason = input.reason.trim();
  if (!reason) return { ok: false, error: "Изберете причина." };
  if (!input.targetId) return { ok: false, error: "Невалиден обект." };

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel?.slice(0, 160) || null,
      reason: reason.slice(0, 120),
      note: input.note?.trim().slice(0, 1000) || null,
    },
  });

  return { ok: true };
}
