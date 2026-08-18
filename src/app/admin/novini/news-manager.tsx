"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { createNewsItem, updateNewsItem, deleteNewsItem } from "./actions";

export type NewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  category: string;
  eventDate: string | null;
  eventEndDate: string | null;
  location: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  coverUrl: string | null;
  published: boolean;
};

type Draft = {
  title: string;
  summary: string;
  body: string;
  category: string;
  eventDate: string;
  eventEndDate: string;
  location: string;
  sourceUrl: string;
  sourceName: string;
  coverUrl: string;
  published: boolean;
};

const empty = (): Draft => ({
  title: "",
  summary: "",
  body: "",
  category: "Събития",
  eventDate: "",
  eventEndDate: "",
  location: "",
  sourceUrl: "",
  sourceName: "",
  coverUrl: "",
  published: true,
});

/** ISO дата → стойност за <input type="date"> */
function toInputDate(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function toDraft(n: NewsRow): Draft {
  return {
    title: n.title,
    summary: n.summary,
    body: n.body ?? "",
    category: n.category,
    eventDate: toInputDate(n.eventDate),
    eventEndDate: toInputDate(n.eventEndDate),
    location: n.location ?? "",
    sourceUrl: n.sourceUrl ?? "",
    sourceName: n.sourceName ?? "",
    coverUrl: n.coverUrl ?? "",
    published: n.published,
  };
}

export function NewsManager({ items }: { items: NewsRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {!adding ? (
        <div>
          <Button onClick={() => setAdding(true)}>+ Нова новина или събитие</Button>
        </div>
      ) : (
        <Editor
          initial={empty()}
          onCancel={() => setAdding(false)}
          onSubmit={async (d) => {
            const res = await createNewsItem(toInput(d));
            if (res.ok) {
              setAdding(false);
              router.refresh();
            }
            return res;
          }}
        />
      )}

      {items.length === 0 && !adding ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center text-muted-foreground">
          Още няма публикувани новини. Добавете първото събитие.
        </div>
      ) : null}

      {items.map((item) =>
        editingId === item.id ? (
          <Editor
            key={item.id}
            initial={toDraft(item)}
            onCancel={() => setEditingId(null)}
            onSubmit={async (d) => {
              const res = await updateNewsItem(item.id, toInput(d));
              if (res.ok) {
                setEditingId(null);
                router.refresh();
              }
              return res;
            }}
          />
        ) : (
          <Row
            key={item.id}
            item={item}
            onEdit={() => setEditingId(item.id)}
            onChanged={() => router.refresh()}
          />
        ),
      )}
    </div>
  );
}

function toInput(d: Draft) {
  return {
    ...d,
    category: d.category as (typeof NEWS_CATEGORIES)[number],
  };
}

function Row({
  item,
  onEdit,
  onChanged,
}: {
  item: NewsRow;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold">{item.title}</h3>
          <Badge tone="primary">{item.category}</Badge>
          {!item.published ? <Badge tone="neutral">Чернова</Badge> : null}
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
          {item.summary}
        </p>
        {item.eventDate ? (
          <p className="mt-0.5 text-xs font-medium text-accent">
            {formatDate(item.eventDate)}
            {item.location ? ` · ${item.location}` : ""}
          </p>
        ) : null}
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
              if (confirm(`Да изтрия ли „${item.title}“?`)) {
                await deleteNewsItem(item.id);
                onChanged();
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

function Editor({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  onSubmit: (d: Draft) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));

  return (
    <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-6 shadow-sm">
      {error ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        <Field label="Заглавие">
          <Input
            value={d.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="напр. Агра 2027 — международно изложение в Пловдив"
          />
        </Field>

        <Field label="Кратко описание" hint="показва се в списъка">
          <Textarea
            value={d.summary}
            onChange={(e) => set({ summary: e.target.value })}
            placeholder="Едно-две изречения какво е и защо е важно за производителите."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Категория">
            <Select
              value={d.category}
              onChange={(e) => set({ category: e.target.value })}
            >
              {NEWS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Място" hint="по избор">
            <Input
              value={d.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="напр. Пловдив, Международен панаир"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Дата на събитието" hint="празно = новина без дата">
            <Input
              type="date"
              value={d.eventDate}
              onChange={(e) => set({ eventDate: e.target.value })}
            />
          </Field>
          <Field label="Край" hint="ако е няколкодневно">
            <Input
              type="date"
              value={d.eventEndDate}
              onChange={(e) => set({ eventEndDate: e.target.value })}
            />
          </Field>
        </div>

        <Field
          label="Пълен текст"
          hint="по избор · ## подзаглавие · - списък · **удебелено** · [текст](/katalog)"
        >
          <Textarea
            value={d.body}
            onChange={(e) => set({ body: e.target.value })}
            rows={10}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Адрес на източника" hint="по избор">
            <Input
              value={d.sourceUrl}
              onChange={(e) => set({ sourceUrl: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <Field label="Име на източника" hint="по избор">
            <Input
              value={d.sourceName}
              onChange={(e) => set({ sourceName: e.target.value })}
              placeholder="напр. ДФ Земеделие"
            />
          </Field>
        </div>

        <Field label="Адрес на корицата" hint="по избор">
          <Input
            value={d.coverUrl}
            onChange={(e) => set({ coverUrl: e.target.value })}
            placeholder="https://..."
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={d.published}
            onChange={(e) => set({ published: e.target.checked })}
            className="h-5 w-5 rounded border-border-strong accent-[var(--color-primary)]"
          />
          Публикувана (видима на сайта)
        </label>
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
