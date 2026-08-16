"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { createReply } from "../actions";

export function ReplyForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = body.trim();
    if (text.length < 2) {
      setError("Съобщението е твърде кратко.");
      return;
    }
    startTransition(async () => {
      const res = await createReply(topicId, text);
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h3 className="font-semibold">Вашият отговор</h3>
      {error ? (
        <p className="mt-2 text-sm font-medium text-danger">{error}</p>
      ) : null}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="mt-3 min-h-28"
        placeholder="Споделете мнение или отговор…"
      />
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Публикуваме…" : "Публикувай отговор"}
        </Button>
      </div>
    </form>
  );
}
