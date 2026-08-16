"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, YIELD_UNITS } from "@/lib/constants";
import { createCrop, updateCrop, deleteCrop } from "./actions";

export type CropRow = {
  id: string;
  name: string;
  category: string | null;
  varieties: string | null;
  sinceYear: number | null;
  decares: number | null;
  annualYield: number | null;
  yieldUnit: string | null;
};

type Draft = {
  name: string;
  category: string;
  varieties: string;
  sinceYear: string;
  decares: string;
  annualYield: string;
  yieldUnit: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  category: "",
  varieties: "",
  sinceYear: "",
  decares: "",
  annualYield: "",
  yieldUnit: "кг",
});

function toDraft(c: CropRow): Draft {
  return {
    name: c.name,
    category: c.category ?? "",
    varieties: c.varieties ?? "",
    sinceYear: c.sinceYear ? String(c.sinceYear) : "",
    decares: c.decares ? String(c.decares) : "",
    annualYield: c.annualYield ? String(c.annualYield) : "",
    yieldUnit: c.yieldUnit ?? "кг",
  };
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function draftToInput(d: Draft) {
  return {
    name: d.name.trim(),
    category: (d.category as (typeof CATEGORIES)[number]) || "",
    varieties: d.varieties.trim(),
    sinceYear: numOrNull(d.sinceYear) as number | null,
    decares: numOrNull(d.decares) as number | null,
    annualYield: numOrNull(d.annualYield) as number | null,
    yieldUnit: (d.yieldUnit as (typeof YIELD_UNITS)[number]) || "",
  };
}

export function CropsManager({ crops }: { crops: CropRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {crops.length === 0 && !adding ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="text-muted-foreground">
            Още не сте добавили култури.
          </p>
          <Button className="mt-4" onClick={() => setAdding(true)}>
            Добави първата култура
          </Button>
        </div>
      ) : null}

      {crops.map((crop) =>
        editingId === crop.id ? (
          <CropEditor
            key={crop.id}
            initial={toDraft(crop)}
            onCancel={() => setEditingId(null)}
            onSubmit={async (draft) => {
              const res = await updateCrop(crop.id, draftToInput(draft));
              if (res.ok) {
                setEditingId(null);
                router.refresh();
              }
              return res;
            }}
          />
        ) : (
          <CropDisplay
            key={crop.id}
            crop={crop}
            onEdit={() => setEditingId(crop.id)}
            onDeleted={() => router.refresh()}
          />
        ),
      )}

      {adding ? (
        <CropEditor
          initial={emptyDraft()}
          onCancel={() => setAdding(false)}
          onSubmit={async (draft) => {
            const res = await createCrop(draftToInput(draft));
            if (res.ok) {
              setAdding(false);
              router.refresh();
            }
            return res;
          }}
        />
      ) : crops.length > 0 ? (
        <div>
          <Button variant="outline" onClick={() => setAdding(true)}>
            + Добави култура
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CropDisplay({
  crop,
  onEdit,
  onDeleted,
}: {
  crop: CropRow;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const meta = [
    crop.sinceYear ? `от ${crop.sinceYear} г.` : null,
    crop.decares ? `${crop.decares} дка` : null,
    crop.annualYield ? `${crop.annualYield} ${crop.yieldUnit ?? ""}/год.` : null,
  ].filter(Boolean);

  return (
    <div className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">{crop.name}</h3>
          {crop.category ? <Badge tone="primary">{crop.category}</Badge> : null}
        </div>
        {crop.varieties ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Сортове: {crop.varieties}
          </p>
        ) : null}
        {meta.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">{meta.join(" · ")}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Редактирай
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (confirm(`Да изтрия ли „${crop.name}“?`)) {
                await deleteCrop(crop.id);
                onDeleted();
              }
            })
          }
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-50"
        >
          Изтрий
        </button>
      </div>
    </div>
  );
}

function CropEditor({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  onSubmit: (draft: Draft) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));

  return (
    <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-5 shadow-sm">
      {error ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Култура">
            <Input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="напр. Домати" />
          </Field>
          <Field label="Категория">
            <Select value={d.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">Изберете</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Сортове или видове" hint="по избор">
          <Input value={d.varieties} onChange={(e) => set({ varieties: e.target.value })} placeholder="напр. Био, Розов, Чери" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="От година">
            <Input inputMode="numeric" value={d.sinceYear} onChange={(e) => set({ sinceYear: e.target.value })} />
          </Field>
          <Field label="Площ (дка)">
            <Input inputMode="decimal" value={d.decares} onChange={(e) => set({ decares: e.target.value })} />
          </Field>
          <Field label="Годишна продукция">
            <Input inputMode="decimal" value={d.annualYield} onChange={(e) => set({ annualYield: e.target.value })} />
          </Field>
          <Field label="Единица">
            <Select value={d.yieldUnit} onChange={(e) => set({ yieldUnit: e.target.value })}>
              {YIELD_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Отказ
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              if (d.name.trim().length < 2) {
                setError("Въведете име на културата.");
                return;
              }
              const res = await onSubmit(d);
              if (!res.ok) setError(res.error ?? "Грешка при запис.");
            })
          }
        >
          {pending ? "Запазваме…" : "Запази"}
        </Button>
      </div>
    </div>
  );
}
