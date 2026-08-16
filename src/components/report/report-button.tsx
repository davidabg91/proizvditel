"use client";

import { useState, useTransition } from "react";
import { Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createReport } from "@/app/p/[slug]/report-actions";

const REASONS = [
  "Измама или съмнителна дейност",
  "Невярна информация",
  "Обидно или неподходящо съдържание",
  "Проблем с поръчка/плащане",
  "Друго",
];

export function ReportButton({
  targetType,
  targetId,
  targetLabel,
  loggedIn,
}: {
  targetType: string;
  targetId: string;
  targetLabel: string;
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-muted-foreground hover:text-danger"
      >
        ⚑ Докладвай този профил
      </button>
    );
  }

  if (done) {
    return (
      <p className="text-xs font-medium text-success">
        Благодарим — сигналът е изпратен и ще бъде прегледан.
      </p>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Докладвай профила</p>
      {!loggedIn ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Влезте, за да изпратите сигнал.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-20"
            placeholder="Опишете накратко проблема (по избор)."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Отказ
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await createReport({
                    targetType,
                    targetId,
                    targetLabel,
                    reason,
                    note,
                  });
                  if (res.ok) setDone(true);
                  else setError(res.error);
                })
              }
            >
              {pending ? "Изпращаме…" : "Изпрати сигнал"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
