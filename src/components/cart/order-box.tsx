"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

type Info = {
  farmName?: string;
  card: boolean;
  payment: {
    acceptsCod: boolean;
    codNote: string | null;
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
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Форма за данни на клиента
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/producers/${producerSlug}/payment`)
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setInfo({ farmName: d.farmName, card: d.card, payment: d.payment });
          if (!d.card && d.payment?.acceptsCod) {
            setPaymentMethod("cod");
          } else if (d.card) {
            setPaymentMethod("card");
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [producerSlug]);

  const methods: string[] = [];
  if (info?.card) methods.push("Карта");
  if (info?.payment?.acceptsCod !== false) methods.push("Наложен платеж");

  const message = [
    "Здравейте!",
    "Бих искал(а) да поръчам:",
    ...orderLines.map((l) => `• ${l}`),
    "",
    "Моля, потвърдете наличност, начин на плащане и доставка.",
  ].join("\n");
  const chatHref = `/chat/${producerSlug}?msg=${encodeURIComponent(message)}`;

  async function handleOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Моля, въведете вашите имена.");
      return;
    }
    if (!phone.trim()) {
      setError("Моля, въведете телефон за връзка.");
      return;
    }
    if (!shippingAddress.trim()) {
      setError("Моля, въведете адрес за доставка или офис на куриер (Еконт / Спиди).");
      return;
    }

    setSubmitting(true);

    try {
      if (paymentMethod === "card") {
        // Плащане с карта през Stripe
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            producerSlug,
            items,
            customerName: customerName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            shippingAddress: shippingAddress.trim(),
            note: note.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error ?? "Грешка при пренасочване към плащането.");
          setSubmitting(false);
        }
      } else {
        // Наложен платеж
        const res = await fetch("/api/checkout/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            producerSlug,
            items,
            customerName: customerName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            shippingAddress: shippingAddress.trim(),
            note: note.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          router.push(
            `/plateno?cod=1&producer=${encodeURIComponent(producerSlug)}&order_id=${encodeURIComponent(data.orderId)}`,
          );
        } else {
          setError(data.error ?? "Грешка при потвърждаване на поръчката.");
          setSubmitting(false);
        }
      }
    } catch {
      setError("Възникна мрежова грешка. Моля, опитайте отново.");
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col gap-3">
        {methods.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Приема:{" "}
            <span className="font-medium text-foreground">{methods.join(" · ")}</span>
          </p>
        ) : null}

        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full"
          size="lg"
        >
          Поръчай
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleOrderSubmit}
      className="mt-3 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-primary/20 bg-surface-muted/40 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="font-semibold text-foreground">Данни за поръчката</h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Затвори ✕
        </button>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-md)] bg-danger/10 p-3 text-xs font-medium text-danger">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Име и фамилия *">
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Иван Иванов"
            required
          />
        </Field>

        <Field label="Телефон за връзка *">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0888 123 456"
            required
          />
        </Field>
      </div>

      <Field label="Имейл за контакт" hint="по избор">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vashiat@email.com"
        />
      </Field>

      <Field
        label="Адрес за доставка или офис на куриер *"
        description="напр. гр. София, офис на Еконт / Спиди или точен адрес"
      >
        <Textarea
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          placeholder="Град, улица, номер или офис на Еконт/Спиди"
          rows={2}
          required
        />
      </Field>

      <Field label="Бележка към поръчката" hint="по избор">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="напр. предпочитан час за доставка, указания"
        />
      </Field>

      {/* Начин на плащане */}
      <div className="mt-2 flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Начин на плащане
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {info?.card ? (
            <label
              className={[
                "flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border p-3 transition-colors",
                paymentMethod === "card"
                  ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                  : "border-border bg-surface hover:border-border-strong",
              ].join(" ")}
            >
              <input
                type="radio"
                name={`pay_${producerSlug}`}
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
                className="mt-0.5 accent-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  💳 Плащане с карта
                </p>
                <p className="text-xs text-muted-foreground">
                  Сигурно онлайн плащане
                </p>
              </div>
            </label>
          ) : null}

          {info?.payment?.acceptsCod !== false ? (
            <label
              className={[
                "flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border p-3 transition-colors",
                paymentMethod === "cod"
                  ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                  : "border-border bg-surface hover:border-border-strong",
              ].join(" ")}
            >
              <input
                type="radio"
                name={`pay_${producerSlug}`}
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="mt-0.5 accent-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  📦 Наложен платеж
                </p>
                <p className="text-xs text-muted-foreground">
                  {info?.payment?.codNote || "Плащане при доставка"}
                </p>
              </div>
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button type="submit" disabled={submitting} className="w-full" size="lg">
          {submitting
            ? "Обработваме…"
            : paymentMethod === "card"
              ? "Продължи към плащане с карта"
              : "Потвърди поръчката с наложен платеж"}
        </Button>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="hover:underline"
          >
            Отказ
          </button>
          <a href={chatHref} className="text-primary hover:underline">
            или пиши на производителя в чата
          </a>
        </div>
      </div>
    </form>
  );
}

