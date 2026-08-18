"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { registerCustomer } from "./actions";

export function CustomerForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        password,
        acceptTerms: acceptTerms as true,
      });
      if (res.ok) {
        router.push(next || "/katalog");
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
      <Field label="Вашето име" htmlFor="name">
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Име и фамилия" />
      </Field>
      <Field label="Имейл" htmlFor="email">
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vie@email.bg" />
      </Field>
      <Field label="Парола" htmlFor="password" description="Поне 8 символа.">
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </Field>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-strong accent-[var(--color-primary)]"
        />
        <span className="text-muted-foreground">
          Прочетох и приемам{" "}
          <a href="/usloviya" target="_blank" className="font-medium text-primary underline">
            Общите условия
          </a>{" "}
          и{" "}
          <a href="/poveritelnost" target="_blank" className="font-medium text-primary underline">
            Политиката за поверителност
          </a>
          .
        </span>
      </label>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Създаваме акаунта…" : "Създай акаунт"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Вече имате акаунт?{" "}
        <Link href="/vhod" className="font-medium text-primary hover:underline">
          Влезте
        </Link>
      </p>
    </form>
  );
}
