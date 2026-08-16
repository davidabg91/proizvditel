"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await login({ email: email.trim(), password });
      if (res.ok) {
        const dest = next || (res.role === "producer" ? "/tablo" : "/katalog");
        router.push(dest);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}
      <Field label="Имейл" htmlFor="email">
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="vie@email.bg"
        />
      </Field>
      <Field label="Парола" htmlFor="password">
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Влизаме…" : "Вход"}
      </Button>
      <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
        <p>Нямате акаунт?</p>
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:justify-center sm:gap-3">
          <Link href="/registraciya/kupuvach" className="font-medium text-primary hover:underline">
            Регистрирайте се като купувач
          </Link>
          <span className="hidden text-border-strong sm:inline">·</span>
          <Link href="/registraciya" className="font-medium text-primary hover:underline">
            Регистрирайте стопанство
          </Link>
        </div>
      </div>
    </form>
  );
}
