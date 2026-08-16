import { prisma } from "@/lib/prisma";
import { ReportsManager } from "./reports-manager";

export const metadata = { title: "Доклади · Админ" };

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 300,
    include: { reporter: { select: { name: true } } },
  });

  const rows = reports.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetLabel: r.targetLabel,
    reason: r.reason,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    reporterName: r.reporter?.name ?? null,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Доклади</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Сигнали от потребители. Прегледайте и вземете мерки при нужда.
        </p>
      </div>
      <ReportsManager reports={rows} />
    </div>
  );
}
