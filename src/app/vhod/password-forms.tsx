"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, resetPassword } from "./parola-actions";

export function ForgotPasswordForm({ supportEmail }: { supportEmail: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-success/30 bg-success-soft p-5 text-sm leading-relaxed">
        <p className="font-semibold text-success">Проверете пощата си</p>
        <p className="mt-1 text-foreground/80">
          Ако има профил с този имейл, изпратихме връзка за нова парола. Тя е
          валидна 1 час. Проверете и папката „Спам“.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await requestPasswordReset(email);
          if (res.ok) setSent(true);
          else setError(res.error);
        });
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Имейл" htmlFor="reset-email">
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      {error ? (
        <p className="text-sm font-medium text-danger">
          {error}{" "}
          {error.includes("Пишете ни") ? (
            <a href={`mailto:${supportEmail}`} className="underline">
              {supportEmail}
            </a>
          ) : null}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Изпращаме…" : "Изпрати връзка"}
      </Button>
      <Link href="/vhod" className="text-center text-sm font-medium text-primary hover:underline">
        ← Обратно към входа
      </Link>
    </form>
  );
}

export function NewPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-[var(--radius-lg)] border border-success/30 bg-success-soft p-5 text-sm font-medium text-success">
          Паролата е сменена. Вече можете да влезете с новата.
        </p>
        <Button href="/vhod" size="lg" className="w-full">
          Към входа
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (password !== repeat) {
          setError("Паролите не съвпадат.");
          return;
        }
        start(async () => {
          const res = await resetPassword(token, password);
          if (res.ok) setDone(true);
          else setError(res.error);
        });
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Нова парола" htmlFor="np" hint="поне 8 символа">
        <Input
          id="np"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Field label="Повторете паролата" htmlFor="np2">
        <Input
          id="np2"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          required
        />
      </Field>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Записваме…" : "Запиши новата парола"}
      </Button>
    </form>
  );
}
