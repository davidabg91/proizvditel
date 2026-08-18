"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { formatPrice, formatRelative } from "@/lib/utils";
import { updateOrder } from "./actions";

export type OrderRow = {
  id: string;
  createdAt: string;
  amountTotal: number;
  currency: string;
  paymentMethod?: string;
  combined: boolean;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  shippingAddress: string | null;
  fulfillmentStatus: string;
  courier: string | null;
  trackingNote: string | null;
  items: { title: string; unitPrice: number; qty: number }[];
};

const STATUS: Record<string, { label: string; tone: "neutral" | "primary" | "accent" | "success" | "danger" }> = {
  new: { label: "Нова", tone: "accent" },
  processing: { label: "Обработва се", tone: "primary" },
  shipped: { label: "Изпратена", tone: "primary" },
  delivered: { label: "Доставена", tone: "success" },
  cancelled: { label: "Отказана", tone: "danger" },
};

const STATUS_OPTIONS = [
  ["new", "Нова"],
  ["processing", "Обработва се"],
  ["shipped", "Изпратена"],
  ["delivered", "Доставена"],
  ["cancelled", "Отказана"],
] as const;

const FILTERS = [
  ["all", "Всички"],
  ["new", "Нови"],
  ["processing", "За изпращане"],
  ["shipped", "Изпратени"],
  ["delivered", "Доставени"],
] as const;

export function OrdersManager({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState<string>("all");

  const shown =
    filter === "all"
      ? orders
      : orders.filter((o) => o.fulfillmentStatus === filter);

  return (
    <div>
      <p className="mb-5 rounded-[var(--radius-md)] border border-primary/25 bg-primary-soft/50 px-4 py-3 text-sm leading-relaxed text-foreground/85">
        💶 Парите от поръчките, платени с карта, се превеждат по вашата Stripe сметка,
        когато отбележите поръчката като <strong>„Доставена“</strong>. Дотогава сумата
        стои при платформата — така не рискувате да върнете пари, ако клиент оспори
        плащането, докато пратката още пътува.
      </p>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(([key, label]) => {
          const count =
            key === "all"
              ? orders.length
              : orders.filter((o) => o.fulfillmentStatus === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border-strong bg-surface text-foreground hover:border-primary",
              ].join(" ")}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-12 text-center text-muted-foreground">
          Няма поръчки в тази категория.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {shown.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(order.fulfillmentStatus);
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.trackingNote ?? "");
  const [saved, setSaved] = useState(false);

  const st = STATUS[order.fulfillmentStatus] ?? STATUS.new;

  function save() {
    setSaved(false);
    startTransition(async () => {
      const res = await updateOrder(order.id, {
        fulfillmentStatus: status,
        courier,
        trackingNote: tracking,
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    });
  }

  const dirty =
    status !== order.fulfillmentStatus ||
    courier !== (order.courier ?? "") ||
    tracking !== (order.trackingNote ?? "");

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      {/* Заглавна лента */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/50 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={st.tone}>{st.label}</Badge>
          {order.paymentMethod === "cod" ? (
            <Badge tone="accent">Наложен платеж</Badge>
          ) : (
            <Badge tone="success">Платено с карта</Badge>
          )}
          {order.combined ? <Badge tone="neutral">Съвместна доставка</Badge> : null}
          <span className="text-sm text-muted-foreground">
            № {order.id.slice(-6).toUpperCase()} · {formatRelative(order.createdAt)}
          </span>
        </div>
        <span className="font-serif text-lg font-semibold">
          {formatPrice(order.amountTotal / 100)}
        </span>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
        {/* Какво да се изпрати */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            За изпращане
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {it.title} × {it.qty}
                </span>
                <span className="text-muted-foreground">
                  {formatPrice((it.unitPrice * it.qty) / 100)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* До кого / къде */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Доставка до
          </p>
          <div className="mt-2 text-sm">
            <p className="font-medium">{order.customerName ?? "—"}</p>
            {order.shippingAddress ? (
              <p className="text-foreground/90">{order.shippingAddress}</p>
            ) : null}
            <p className="mt-1 text-muted-foreground">
              {order.phone ? `тел. ${order.phone}` : ""}
              {order.phone && order.email ? " · " : ""}
              {order.email ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* Обработка */}
      <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-[160px_1fr_1fr_auto] sm:items-end">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-muted-foreground">Статус</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-muted-foreground">Куриер</span>
          <Input
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="напр. Еконт"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-muted-foreground">
            Товарителница / бележка
          </span>
          <Input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="напр. номер за проследяване"
          />
        </label>
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "…" : saved && !dirty ? "Запазено" : "Запази"}
        </Button>
      </div>
    </div>
  );
}
