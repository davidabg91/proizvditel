"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating";
import { confirmPurchase, removePurchase } from "./actions";

export type ClientRow = {
  customerId: string;
  name: string;
  confirmed: boolean;
  review: { rating: number; comment: string | null } | null;
};

export function KlientiManager({ clients }: { clients: ClientRow[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-12 text-center text-muted-foreground">
        Все още нямате клиенти, които са се свързали с вас.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <ul className="divide-y divide-border">
        {clients.map((c) => (
          <ClientItem key={c.customerId} client={c} />
        ))}
      </ul>
    </div>
  );
}

function ClientItem({ client }: { client: ClientRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center gap-4 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted font-serif text-lg font-semibold text-primary">
        {client.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{client.name}</p>
        {client.review ? (
          <div className="mt-1 flex items-center gap-2">
            <RatingStars value={client.review.rating} size="sm" />
            {client.review.comment ? (
              <span className="truncate text-sm text-muted-foreground">
                „{client.review.comment}"
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {client.confirmed ? "Може да остави оценка" : "Свързал се е с вас"}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {client.confirmed ? (
          <>
            <Badge tone="success">Потвърдена покупка</Badge>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await removePurchase(client.customerId);
                  router.refresh();
                })
              }
              className="text-sm font-medium text-muted-foreground hover:text-danger disabled:opacity-50"
            >
              Отмени
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await confirmPurchase(client.customerId);
                router.refresh();
              })
            }
            className="rounded-[var(--radius-sm)] bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            Потвърди покупка
          </button>
        )}
      </div>
    </li>
  );
}
