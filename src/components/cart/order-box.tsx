"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Info = {
  card: boolean;
  payment: {
    acceptsBankTransfer: boolean;
    acceptsRevolut: boolean;
    acceptsCod: boolean;
  };
};

export function OrderBox({
  producerSlug,
  orderLines,
  items,
}: {
  producerSlug: string;
  orderLines: string[];
  items: { listingId: string; qty: number }[];
}) {
  const [info, setInfo] = useState<Info | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/producers/${producerSlug}/payment`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setInfo({ card: d.card, payment: d.payment });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [producerSlug]);

  const methods: string[] = [];
  if (info?.card) methods.push("Карта");
  if (info?.payment?.acceptsRevolut) methods.push("Revolut");
  if (info?.payment?.acceptsBankTransfer) methods.push("Банков превод");
  if (info?.payment?.acceptsCod) methods.push("Наложен платеж");

  const message = [
    "Здравейте!",
    "Бих искал(а) да поръчам:",
    ...orderLines.map((l) => `• ${l}`),
    "",
    "Моля, потвърдете наличност, начин на плащане и доставка.",
  ].join("\n");
  const chatHref = `/chat/${producerSlug}?msg=${encodeURIComponent(message)}`;

  async function payByCard() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producerSlug, items }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Грешка при плащането.");
        setPaying(false);
      }
    } catch {
      setError("Грешка при плащането.");
      setPaying(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {methods.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Приема:{" "}
          <span className="font-medium text-foreground">{methods.join(" · ")}</span>
        </p>
      ) : null}

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

      {info?.card ? (
        <Button onClick={payByCard} disabled={paying} className="w-full">
          {paying ? "Пренасочваме към плащане…" : "Плати с карта"}
        </Button>
      ) : null}

      <Button
        href={chatHref}
        variant={info?.card ? "outline" : "primary"}
        className="w-full"
      >
        Поръчай — пиши на производителя
      </Button>
    </div>
  );
}
