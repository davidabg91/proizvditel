"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, UNITS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { createListing, updateListing, deleteListing } from "./actions";

export type ListingRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  oldPrice: number | null;
  unit: string;
  currency: string;
  available: boolean;
  isOffer: boolean;
  stockNote: string | null;
  photos: string[];
};

type Draft = {
  title: string;
  description: string;
  category: string;
  price: string;
  oldPrice: string;
  unit: string;
  currency: string;
  available: boolean;
  isOffer: boolean;
  stockNote: string;
  photos: string[];
};

const emptyDraft = (): Draft => ({
  title: "",
  description: "",
  category: "",
  price: "",
  oldPrice: "",
  unit: "кг",
  currency: "BGN",
  available: true,
  isOffer: false,
  stockNote: "",
  photos: [],
});

function toDraft(l: ListingRow): Draft {
  return {
    title: l.title,
    description: l.description ?? "",
    category: l.category ?? "",
    price: String(l.price),
    oldPrice: l.oldPrice ? String(l.oldPrice) : "",
    unit: l.unit,
    currency: l.currency,
    available: l.available,
    isOffer: l.isOffer,
    stockNote: l.stockNote ?? "",
    photos: l.photos,
  };
}

function num(v: string): number {
  return Number(v.replace(",", "."));
}

function draftToInput(d: Draft) {
  return {
    title: d.title.trim(),
    description: d.description.trim(),
    category: (d.category as (typeof CATEGORIES)[number]) || "",
    price: num(d.price),
    oldPrice: d.oldPrice.trim() ? num(d.oldPrice) : null,
    unit: d.unit as (typeof UNITS)[number],
    currency: d.currency as "BGN" | "EUR",
    available: d.available,
    isOffer: d.isOffer,
    stockNote: d.stockNote.trim(),
    photos: d.photos,
  };
}

export function ListingsManager({ listings }: { listings: ListingRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {!adding ? (
        <div>
          <Button onClick={() => setAdding(true)}>+ Нова обява</Button>
        </div>
      ) : (
        <ListingEditor
          initial={emptyDraft()}
          onCancel={() => setAdding(false)}
          onSubmit={async (draft) => {
            const res = await createListing(draftToInput(draft));
            if (res.ok) {
              setAdding(false);
              router.refresh();
            }
            return res;
          }}
        />
      )}

      {listings.length === 0 && !adding ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center text-muted-foreground">
          Още нямате обяви. Добавете първия си продукт за продажба.
        </div>
      ) : null}

      {listings.map((listing) =>
        editingId === listing.id ? (
          <ListingEditor
            key={listing.id}
            initial={toDraft(listing)}
            onCancel={() => setEditingId(null)}
            onSubmit={async (draft) => {
              const res = await updateListing(listing.id, draftToInput(draft));
              if (res.ok) {
                setEditingId(null);
                router.refresh();
              }
              return res;
            }}
          />
        ) : (
          <ListingDisplay
            key={listing.id}
            listing={listing}
            onEdit={() => setEditingId(listing.id)}
            onDeleted={() => router.refresh()}
          />
        ),
      )}
    </div>
  );
}

function ListingDisplay({
  listing,
  onEdit,
  onDeleted,
}: {
  listing: ListingRow;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold">{listing.title}</h3>
          {listing.isOffer ? <Badge tone="accent">Оферта</Badge> : null}
          {!listing.available ? <Badge tone="neutral">Скрита</Badge> : null}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatPrice(listing.price, listing.currency as "BGN" | "EUR")} / {listing.unit}
          {listing.category ? ` · ${listing.category}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Редактирай
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (confirm(`Да изтрия ли „${listing.title}“?`)) {
                await deleteListing(listing.id);
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

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Грешка при качване.");
  return data.url as string;
}

function ListingEditor({
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
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));

  async function onFiles(files: FileList | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of list.slice(0, 8 - d.photos.length)) {
        urls.push(await uploadFile(file));
      }
      set({ photos: [...d.photos, ...urls].slice(0, 8) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при качване.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-6 shadow-sm">
      {error ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        {/* Снимки */}
        <div>
          <p className="mb-2 text-sm font-semibold">Снимки на продукта</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {d.photos.map((url, i) => (
              <div
                key={url + i}
                className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => set({ photos: d.photos.filter((_, idx) => idx !== i) })}
                  className="absolute right-1.5 top-1.5 rounded bg-foreground/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
            {d.photos.length < 8 ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60"
              >
                <span className="text-2xl font-light leading-none">+</span>
                {uploading ? "Качваме…" : "Снимка"}
              </button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        <Field label="Заглавие">
          <Input
            value={d.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="напр. Ягоди сорт Клери — първо качество"
          />
        </Field>

        <Field label="Описание" hint="по избор">
          <Textarea
            value={d.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Разкажете за продукта — как е отгледан, вкус, начин на доставка."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Категория">
            <Select value={d.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">Изберете</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Наличност" hint="по избор">
            <Input
              value={d.stockNote}
              onChange={(e) => set({ stockNote: e.target.value })}
              placeholder="напр. Сезонно, до октомври"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Цена">
            <Input
              inputMode="decimal"
              value={d.price}
              onChange={(e) => set({ price: e.target.value })}
              placeholder="0.00"
            />
          </Field>
          <Field label="Стара цена" hint="оферта">
            <Input
              inputMode="decimal"
              value={d.oldPrice}
              onChange={(e) => set({ oldPrice: e.target.value })}
              placeholder="по избор"
            />
          </Field>
          <Field label="Мерна единица">
            <Select value={d.unit} onChange={(e) => set({ unit: e.target.value })}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </Field>
          <Field label="Валута">
            <Select value={d.currency} onChange={(e) => set({ currency: e.target.value })}>
              <option value="BGN">лв. (BGN)</option>
              <option value="EUR">€ (EUR)</option>
            </Select>
          </Field>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={d.available}
              onChange={(e) => set({ available: e.target.checked })}
              className="h-5 w-5 rounded border-border-strong accent-[var(--color-primary)]"
            />
            Активна (видима в каталога)
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={d.isOffer}
              onChange={(e) => set({ isOffer: e.target.checked })}
              className="h-5 w-5 rounded border-border-strong accent-[var(--color-accent)]"
            />
            Маркирай като оферта
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Отказ
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              if (d.title.trim().length < 2) return setError("Въведете заглавие.");
              if (!d.price.trim() || !Number.isFinite(num(d.price)))
                return setError("Въведете валидна цена.");
              const res = await onSubmit(d);
              if (!res.ok) setError(res.error ?? "Грешка при запис.");
            })
          }
        >
          {pending ? "Запазваме…" : "Запази обявата"}
        </Button>
      </div>
    </div>
  );
}
