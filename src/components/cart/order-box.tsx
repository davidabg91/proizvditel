"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Payment = {
  acceptsBankTransfer: boolean;
  acceptsRevolut: boolean;
  acceptsCod: boolean;
};

export function OrderBox({
  producerSlug,
  orderLines,
}: {
  producerSlug: string;
  orderLines: string[];
}) {
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/producers/${producerSlug}/payment`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setPayment(d.payment as Payment);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [producerSlug]);

  const methods: string[] = [];
  if (payment?.acceptsRevolut) methods.push("Revolut");
  if (payment?.acceptsBankTransfer) methods.push("Банков превод");
  if (payment?.acceptsCod) methods.push("Наложен платеж");

  const message = [
    "Здравейте!",
    "Бих искал(а) да поръчам:",
    ...orderLines.map((l) => `• ${l}`),
    "",
    "Моля, потвърдете наличност, начин на плащане и доставка.",
  ].join("\n");
  const href = `/chat/${producerSlug}?msg=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-col gap-3">
      {methods.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Приема: <span className="font-medium text-foreground">{methods.join(" · ")}</span>
        </p>
      ) : null}
      <Button href={href} className="w-full">
        Поръчай — пиши на производителя
      </Button>
    </div>
  );
}
