"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { createTopic } from "../actions";

export function NewTopicForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(FORUM_CATEGORIES[0]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createTopic({
        title: title.trim(),
        category: category as (typeof FORUM_CATEGORIES)[number],
        body: body.trim(),
      });
      if (res.ok) {
        router.push(`/forum/${res.slug}`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}
      <Field label="Заглавие" htmlFor="title">
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="напр. Кой сорт домати се справя най-добре на открито?"
        />
      </Field>
      <Field label="Категория" htmlFor="category">
        <Select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {FORUM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Съобщение" htmlFor="body">
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-40"
          placeholder="Опишете въпроса или темата си подробно…"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button href="/forum" variant="ghost">
          Отказ
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Публикуваме…" : "Публикувай темата"}
        </Button>
      </div>
    </form>
  );
}
