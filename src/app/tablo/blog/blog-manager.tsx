"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/media/image-uploader";
import { BLOG_CATEGORIES } from "@/lib/constants";
import { createPost, updatePost, deletePost } from "./actions";

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  published: boolean;
};

type Draft = {
  title: string;
  category: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  published: boolean;
};

const emptyDraft = (): Draft => ({
  title: "",
  category: BLOG_CATEGORIES[0],
  excerpt: "",
  body: "",
  coverUrl: null,
  published: true,
});

function toDraft(p: PostRow): Draft {
  return {
    title: p.title,
    category: p.category,
    excerpt: p.excerpt ?? "",
    body: p.body,
    coverUrl: p.coverUrl,
    published: p.published,
  };
}

function toInput(d: Draft) {
  return {
    title: d.title.trim(),
    category: d.category as (typeof BLOG_CATEGORIES)[number],
    excerpt: d.excerpt.trim(),
    body: d.body.trim(),
    coverUrl: d.coverUrl ?? "",
    published: d.published,
  };
}

export function BlogManager({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {!adding ? (
        <div>
          <Button onClick={() => setAdding(true)}>+ Нова статия</Button>
        </div>
      ) : (
        <Editor
          initial={emptyDraft()}
          onCancel={() => setAdding(false)}
          onSubmit={async (d) => {
            const res = await createPost(toInput(d));
            if (res.ok) {
              setAdding(false);
              router.refresh();
            }
            return res;
          }}
        />
      )}

      {posts.length === 0 && !adding ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center text-muted-foreground">
          Още нямате статии. Споделете полезното за вашите продукти.
        </div>
      ) : null}

      {posts.map((p) =>
        editingId === p.id ? (
          <Editor
            key={p.id}
            initial={toDraft(p)}
            onCancel={() => setEditingId(null)}
            onSubmit={async (d) => {
              const res = await updatePost(p.id, toInput(d));
              if (res.ok) {
                setEditingId(null);
                router.refresh();
              }
              return res;
            }}
          />
        ) : (
          <Row
            key={p.id}
            post={p}
            onEdit={() => setEditingId(p.id)}
            onDeleted={() => router.refresh()}
          />
        ),
      )}
    </div>
  );
}

function Row({
  post,
  onEdit,
  onDeleted,
}: {
  post: PostRow;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold">{post.title}</h3>
          <Badge tone="accent">{post.category}</Badge>
          {!post.published ? <Badge tone="neutral">Чернова</Badge> : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {post.published ? (
          <Link
            href={`/blog/${post.slug}`}
            className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Виж
          </Link>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Редактирай
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (confirm(`Да изтрия ли „${post.title}“?`)) {
                await deletePost(post.id);
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
        <div>
          <p className="mb-2 text-sm font-semibold">Заглавна снимка</p>
          <ImageUploader
            value={d.coverUrl}
            onChange={(url) => set({ coverUrl: url })}
            aspect="wide"
            label="Заглавна снимка на статията"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Заглавие">
            <Input
              value={d.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="напр. Ползите от пчелния мед"
            />
          </Field>
          <Field label="Категория">
            <Select value={d.category} onChange={(e) => set({ category: e.target.value })}>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Кратко въведение" hint="по избор">
          <Textarea
            value={d.excerpt}
            onChange={(e) => set({ excerpt: e.target.value })}
            className="min-h-16"
            placeholder="Едно-две изречения, които се показват в списъка."
          />
        </Field>
        <Field label="Съдържание">
          <Textarea
            value={d.body}
            onChange={(e) => set({ body: e.target.value })}
            className="min-h-64"
            placeholder="Напишете статията…"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={d.published}
            onChange={(e) => set({ published: e.target.checked })}
            className="h-5 w-5 rounded border-border-strong accent-[var(--color-primary)]"
          />
          Публикувай веднага (иначе се запазва като чернова)
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
              if (d.title.trim().length < 5) return setError("Въведете заглавие.");
              if (d.body.trim().length < 30) return setError("Съдържанието е твърде кратко.");
              const res = await onSubmit(d);
              if (!res.ok) setError(res.error ?? "Грешка при запис.");
            })
          }
        >
          {pending ? "Запазваме…" : "Запази статията"}
        </Button>
      </div>
    </div>
  );
}
