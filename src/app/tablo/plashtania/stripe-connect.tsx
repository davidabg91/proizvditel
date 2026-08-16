"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  startStripeOnboarding,
  refreshStripeStatus,
  getStripeDashboardLink,
} from "./stripe-actions";

export function StripeConnect({
  hasAccount,
  chargesEnabled,
  justReturned,
}: {
  hasAccount: boolean;
  chargesEnabled: boolean;
  justReturned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // След връщане от Stripe — опресняваме статуса
  useEffect(() => {
    if (justReturned && hasAccount && !chargesEnabled) {
      refreshStripeStatus().then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function connect() {
    setError(null);
    startTransition(async () => {
      const res = await startStripeOnboarding();
      if (res.ok && res.url) window.location.href = res.url;
      else if (!res.ok) setError(res.error);
    });
  }

  function checkStatus() {
    setError(null);
    startTransition(async () => {
      const res = await refreshStripeStatus();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function openDashboard() {
    setError(null);
    startTransition(async () => {
      const res = await getStripeDashboardLink();
      if (res.ok && res.url) window.open(res.url, "_blank");
      else if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Плащане с карта (Stripe)</h2>
        {chargesEnabled ? (
          <Badge tone="success">Активно</Badge>
        ) : hasAccount ? (
          <Badge tone="accent">Незавършена регистрация</Badge>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Клиентите плащат с карта, а парите постъпват{" "}
        <strong>директно във вашата Stripe сметка</strong>. Платформата удържа{" "}
        <strong>5% комисиона</strong>, а таксите на Stripe са за ваша сметка.
      </p>

      {error ? (
        <p className="mt-3 text-sm font-medium text-danger">{error}</p>
      ) : null}

      <div className="mt-4">
        {!hasAccount ? (
          <Button onClick={connect} disabled={pending}>
            {pending ? "Свързваме…" : "Свържи Stripe и приемай карти"}
          </Button>
        ) : chargesEnabled ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-[var(--radius-md)] bg-success-soft px-4 py-3 text-sm text-success">
              Приемате плащания с карта. Клиентите вече могат да плащат онлайн, а
              средствата отиват директно при вас.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openDashboard} disabled={pending}>
                Отвори Stripe таблото
              </Button>
              <Button variant="ghost" onClick={checkStatus} disabled={pending}>
                Провери статуса
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Регистрацията в Stripe не е завършена. Довършете я, за да започнете
              да приемате плащания.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={connect} disabled={pending}>
                {pending ? "Отваряме…" : "Довърши регистрацията"}
              </Button>
              <Button variant="ghost" onClick={checkStatus} disabled={pending}>
                Провери статуса
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
