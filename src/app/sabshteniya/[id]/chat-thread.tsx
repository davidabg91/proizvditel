"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { sendMessage } from "../actions";

type Msg = { id: string; body: string; createdAt: string; mine: boolean };

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ChatThread({
  conversationId,
  initialMessages,
  initialDraft = "",
}: {
  conversationId: string;
  initialMessages: Msg[];
  initialDraft?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState(initialDraft);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // тихо игнорираме — ще опитаме отново
    }
  }

  // Периодично опресняване
  useEffect(() => {
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Скрол до дъното при нови съобщения
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setError(null);
    // оптимистично добавяне
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    startTransition(async () => {
      const res = await sendMessage(conversationId, body);
      if (!res.ok) {
        setError(res.error);
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        setText(body);
      } else {
        refresh();
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[420px] flex-col rounded-[var(--radius-lg)] border border-border bg-surface">
      <div
        ref={scrollAreaRef}
        className="flex-1 space-y-3 overflow-y-auto p-5"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Все още няма съобщения. Напишете първото.
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-relaxed",
                m.mine
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p
                className={cn(
                  "mt-1 text-[0.7rem]",
                  m.mine ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {formatTime(m.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-border p-3">
        {error ? (
          <p className="mb-2 text-sm font-medium text-danger">{error}</p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            rows={Math.min(8, Math.max(1, text.split("\n").length))}
            placeholder="Напишете съобщение…"
            className="max-h-52 min-h-11 flex-1 resize-none rounded-[var(--radius-md)] border border-border-strong bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="h-11 shrink-0 self-end rounded-[var(--radius-md)] bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            Изпрати
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Съвет: добавете вашето име, адрес за доставка и телефон, за да може
          производителят да организира пратката.
        </p>
      </form>
    </div>
  );
}
