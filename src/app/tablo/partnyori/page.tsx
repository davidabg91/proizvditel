import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProducer } from "@/lib/session";
import { getPartnerBoard } from "@/lib/partners";
import { PartnersManager } from "./partners-manager";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Партньори за доставка" };

export default async function PartnersPage() {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  if (!producer.sharedDelivery) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Партньори за доставка</h1>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
          <p className="text-muted-foreground">
            За да избирате партньори, първо включете „Съвместно пазаруване" в профила
            на стопанството.
          </p>
          <Button href="/tablo/profil" className="mt-5">
            Към профила
          </Button>
        </div>
      </div>
    );
  }

  const candidates = await getPartnerBoard(producer.id, producer.region);
  const mutualCount = candidates.filter((c) => c.mutual).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Партньори за доставка</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Изберете производители от {producer.region ?? "вашия регион"}, с които
          искате да изпращате заедно. Партньорството е{" "}
          <strong>активно само когато и двете страни се изберат взаимно</strong> —
          тогава клиентите виждат възможността за обща доставка.
        </p>
      </div>

      {mutualCount > 0 ? (
        <p className="mb-4 text-sm font-medium text-success">
          {mutualCount}{" "}
          {mutualCount === 1 ? "активно партньорство" : "активни партньорства"}
        </p>
      ) : null}

      <PartnersManager candidates={candidates} />

      <p className="mt-4 text-xs text-muted-foreground">
        Съвет: свържете се с колегите през{" "}
        <Link href="/forum" className="text-primary hover:underline">
          форума
        </Link>{" "}
        или чрез съобщение, за да се уговорите за съвместна доставка.
      </p>
    </div>
  );
}
