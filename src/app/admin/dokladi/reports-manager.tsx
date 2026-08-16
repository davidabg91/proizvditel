"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";
import { resolveReport } from "../actions";

export type ReportRow = {
  id: string;
  targetType: string;
  targetLabel: string | null;
  reason: string;
  note: string | null;
  status: string;
  createdAt: string;
  reporterName: string | null;
};

export function ReportsManager({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-12 text-center text-muted-foreground">
        Няма доклади. 🎉
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}

function ReportCard({ report }: { report: ReportRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const open = report.status === "open";

  return (
    <div
      className={[
        "rounded-[var(--radius-lg)] border bg-surface p-5",
        open ? "border-danger/30" : "border-border",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={open ? "danger" : "success"}>
            {open ? "Отворен" : "Решен"}
          </Badge>
          <Badge tone="neutral">
            {report.targetType === "producer" ? "Производител" : report.targetType}
          </Badge>
          <span className="font-semibold">{report.targetLabel ?? "—"}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelative(report.createdAt)}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium">{report.reason}</p>
      {report.note ? (
        <p className="mt-1 text-sm text-foreground/80">{report.note}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Подал сигнала: {report.reporterName ?? "неизвестен"}
      </p>

      <div className="mt-4">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolveReport(report.id, open);
              router.refresh();
            })
          }
          className={[
            "rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
            open
              ? "bg-primary text-primary-foreground hover:bg-primary-hover"
              : "border border-border-strong text-foreground hover:border-primary",
          ].join(" ")}
        >
          {open ? "Маркирай като решен" : "Отвори отново"}
        </button>
      </div>
    </div>
  );
}
