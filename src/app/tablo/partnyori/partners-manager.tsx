"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { togglePartner } from "./actions";
import type { PartnerCandidate } from "@/lib/partners";

export function PartnersManager({ candidates }: { candidates: PartnerCandidate[] }) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-12 text-center text-muted-foreground">
        Няма други производители със съвместна доставка във вашия регион засега.
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface divide-y divide-border">
      {candidates.map((c) => (
        <PartnerRow key={c.id} c={c} />
      ))}
    </ul>
  );
}

function PartnerRow({ c }: { c: PartnerCandidate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await togglePartner(c.id, !c.selectedByMe);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-4 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-serif text-lg font-semibold text-primary">
        {c.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          c.farmName.charAt(0)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/p/${c.slug}`} className="font-semibold hover:text-primary">
          {c.farmName}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {c.town ? (
            <span className="text-sm text-muted-foreground">{c.town}</span>
          ) : null}
          {c.mutual ? (
            <Badge tone="success">Активно партньорство</Badge>
          ) : c.selectsMe ? (
            <Badge tone="accent">Ви е избрал — изберете и вие</Badge>
          ) : c.selectedByMe ? (
            <Badge tone="neutral">Изчаква потвърждение</Badge>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={[
          "rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
          c.selectedByMe
            ? "border border-border-strong text-muted-foreground hover:text-danger"
            : "bg-primary text-primary-foreground hover:bg-primary-hover",
        ].join(" ")}
      >
        {c.selectedByMe ? "Премахни" : "Работи с този"}
      </button>
    </li>
  );
}
