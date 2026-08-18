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
      if (!res.ok) setError(res.error);
      // Опресняваме и при грешка — ако връзката е била изчистена,
      // секцията трябва да се върне в изходно състояние.
      router.refresh();
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

  const [showInfo, setShowInfo] = useState(false);

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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Приемайте директни плащания с банкови карти от вашите клиенти.
        </p>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/15"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          Информация за таксите и начина на работа
          <span className="ml-0.5 text-[10px]">{showInfo ? "▲" : "▼"}</span>
        </button>
      </div>

      {showInfo && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-surface-muted/70 p-4 sm:p-5 text-sm animate-in fade-in duration-200">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <span>ℹ️</span> Как работи плащането с карта и как се разпределят средствата?
          </h4>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-border/80 bg-surface p-3.5 shadow-sm">
              <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                1. Директни плащания
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Купувачите плащат онлайн с банкова карта. Всички плащания се обработват през сигурната платежна система на <strong>Stripe</strong>. Парите постъпват директно във вашата свързана Stripe сметка и се превеждат автоматично по банковата ви сметка.
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-border/80 bg-surface p-3.5 shadow-sm">
              <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                2. Комисиона на платформата (5%)
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Платформата „Производител“ удържа фиксирана комисиона от <strong>5%</strong> от стойността на всяка успешна поръчка, платена онлайн с карта. Комисионата обезпечава техническата поддръжка, рекламата и привличането на нови купувачи.
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-border/80 bg-surface p-3.5 shadow-sm">
              <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                3. Такси за обработка на Stripe
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Освен комисионата, от сумата се приспада и банковата такса за картовото плащане по официалните тарифи на Stripe за ЕС — обикновено <strong>~1.5% + 0,25 €</strong> на транзакция за стандартна европейска карта. Тя се удържа автоматично при обработката, преди парите да постъпят при вас. Пример: при поръчка за 20,00 € получавате около <strong>18,45 €</strong> (20,00 € − 1,00 € комисиона − ~0,55 € такса).
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-border/80 bg-surface p-3.5 shadow-sm">
              <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                4. Пълна прозрачност и контрол
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Няма месечни абонаменти или фиксирани разходи, ако нямате продажби. Всяко плащане, удържана такса и трансфер към банковата ви сметка са видими в реално време във вашето лично Stripe табло.
              </p>
            </div>
          </div>
        </div>
      )}

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
