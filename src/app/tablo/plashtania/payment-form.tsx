"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { updatePayment } from "./actions";

type Initial = {
  acceptsBankTransfer: boolean;
  bankName: string;
  bankIban: string;
  bankHolder: string;
  acceptsRevolut: boolean;
  revolutLink: string;
  acceptsCod: boolean;
  codNote: string;
};

function MethodToggle({
  enabled,
  onToggle,
  title,
  description,
  children,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border bg-surface p-6 transition-colors",
        enabled ? "border-primary/40" : "border-border",
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-border-strong accent-[var(--color-primary)]"
        />
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </label>
      {enabled && children ? (
        <div className="mt-5 flex flex-col gap-4 pl-8">{children}</div>
      ) : null}
    </div>
  );
}

export function PaymentForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | "saved" | string>(null);
  const [f, setF] = useState(initial);
  const set = (patch: Partial<Initial>) => setF((p) => ({ ...p, ...patch }));

  function save() {
    setStatus(null);
    startTransition(async () => {
      try {
        const res = await updatePayment({
          acceptsBankTransfer: false,
          bankName: "",
          bankIban: "",
          bankHolder: "",
          acceptsRevolut: false,
          revolutLink: "",
          acceptsCod: f.acceptsCod,
          codNote: f.codNote.trim(),
        });
        if (res.ok) {
          setStatus("saved");
          router.refresh();
        } else {
          setStatus(res.error);
        }
      } catch {
        setStatus("Грешка при запазването.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <MethodToggle
        enabled={f.acceptsCod}
        onToggle={(v) => set({ acceptsCod: v })}
        title="Наложен платеж"
        description="Клиентът плаща при доставка чрез куриер."
      >
        <Field label="Бележка" hint="по избор">
          <Input
            value={f.codNote}
            onChange={(e) => set({ codNote: e.target.value })}
            placeholder="напр. Изпращам с Еконт и Спиди"
          />
        </Field>
      </MethodToggle>

      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface/95 p-4 shadow-md backdrop-blur">
        <div className="text-sm">
          {status === "saved" ? (
            <span className="font-medium text-success">Запазено.</span>
          ) : status ? (
            <span className="font-medium text-danger">{status}</span>
          ) : (
            <span className="text-muted-foreground">
              Избраните методи се показват в профила ви.
            </span>
          )}
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? "Запазваме…" : "Запази"}
        </Button>
      </div>
    </div>
  );
}
