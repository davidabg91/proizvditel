"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePassword, deleteAccount } from "./actions";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        if (next !== repeat) {
          setMsg({ ok: false, text: "Новите пароли не съвпадат." });
          return;
        }
        start(async () => {
          const res = await changePassword({ current, next });
          if (res.ok) {
            setMsg({ ok: true, text: "Паролата е сменена." });
            setCurrent("");
            setNext("");
            setRepeat("");
          } else setMsg({ ok: false, text: res.error });
        });
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Текуща парола" htmlFor="pw-current">
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Нова парола" htmlFor="pw-next" hint="поне 8 символа">
          <Input
            id="pw-next"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </Field>
        <Field label="Повторете новата парола" htmlFor="pw-repeat">
          <Input
            id="pw-repeat"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            required
          />
        </Field>
      </div>
      {msg ? (
        <p className={msg.ok ? "text-sm font-medium text-success" : "text-sm font-medium text-danger"}>
          {msg.text}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Записваме…" : "Смени паролата"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteAccountForm({ isProducer }: { isProducer: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" className="border-danger/40 text-danger hover:bg-danger-soft" onClick={() => setOpen(true)}>
        Изтрий профила
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await deleteAccount({ password });
          if (res.ok) {
            router.push("/?iztrit=1");
            router.refresh();
          } else setError(res.error);
        });
      }}
      className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft/50 p-5"
    >
      <p className="text-sm leading-relaxed text-foreground/85">
        Това не може да се отмени. Името, имейлът и контактите ви ще бъдат
        премахнати{isProducer ? ", профилът на стопанството ще бъде скрит, а обявите — спрени" : ""}.
        Поръчките остават в архива без лични данни, защото са счетоводни документи.
      </p>
      <Field label="Въведете паролата си" htmlFor="del-pw">
        <Input
          id="del-pw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Field label='Напишете „ИЗТРИЙ“ за потвърждение' htmlFor="del-confirm">
        <Input id="del-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
      </Field>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={pending || confirmText.trim().toUpperCase() !== "ИЗТРИЙ"}>
          {pending ? "Изтриваме…" : "Изтрий завинаги"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Откажи
        </Button>
      </div>
    </form>
  );
}
