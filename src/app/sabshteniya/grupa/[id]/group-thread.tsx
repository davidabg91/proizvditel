"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { QUICK_REPLIES } from "@/lib/delivery-chat";
import { sendDeliveryMessage } from "../../actions";

type Msg = {
  id: string;
  body: string;
  system: boolean;
  createdAt: string;
  mine: boolean;
  author: string | null;
  logoUrl: string | null;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function GroupThread({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function refresh() {
    try {
      const res = await fetch(`/api/delivery-chats/${chatId}/messages`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // тихо — следващият опит е след 4 секунди
    }
  }

  useEffect(() => {
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body) return;
    setError(null);
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      body,
      system: false,
      createdAt: new Date().toISOString(),
      mine: true,
      author: null,
      logoUrl: null,
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    startTransition(async () => {
      const res = await sendDeliveryMessage(chatId, body);
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
    <div className="flex h-[calc(100vh-16rem)] min-h-[440px] flex-col rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m) =>
          m.system ? (
            <div
              key={m.id}
              className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-success/30 bg-success-soft/50 px-4 py-3"
            >
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                {m.body}
              </p>
            </div>
          ) : (
            <div
              key={m.id}
              className={cn("flex gap-2", m.mine ? "justify-end" : "justify-start")}
            >
              {!m.mine ? (
                <div className="mt-auto flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-serif text-xs font-semibold text-primary">
                  {m.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (m.author ?? "?").charAt(0)
                  )}
                </div>
              ) : null}
              <div
                className={cn(
                  "max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-relaxed",
                  m.mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-muted text-foreground",
                )}
              >
                {!m.mine && m.author ? (
                  <p className="mb-0.5 text-xs font-semibold text-primary">
                    {m.author}
                  </p>
                ) : null}
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
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {/* Готови отговори — за да не се чуди човек как да започне */}
      <div className="border-t border-border px-3 pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Бърз отговор:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setText(q);
                inputRef.current?.focus();
              }}
              className="rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="p-3">
        {error ? (
          <p className="mb-2 text-sm font-medium text-danger">{error}</p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={Math.min(8, Math.max(1, text.split("\n").length))}
            placeholder="Пишете на другите стопанства…"
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
      </form>
    </div>
  );
}
