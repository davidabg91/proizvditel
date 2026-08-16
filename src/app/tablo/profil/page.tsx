import { redirect } from "next/navigation";
import { getCurrentProducer } from "@/lib/session";
import { parseProviders } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./profile-form";

export default async function EditProfilePage() {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Профил на стопанството</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Тази информация се показва публично на страницата ви.
          </p>
        </div>
        <Button href={`/p/${producer.slug}`} variant="outline" size="sm">
          Виж публичния профил
        </Button>
      </div>

      <ProfileForm
        initial={{
          farmName: producer.farmName,
          ownerName: producer.ownerName,
          description: producer.description ?? "",
          urn: producer.urn ?? "",
          region: producer.region ?? "",
          town: producer.town ?? "",
          phone: producer.phone ?? "",
          contactEmail: producer.contactEmail ?? "",
          website: producer.website ?? "",
          startedYear: producer.startedYear ? String(producer.startedYear) : "",
          totalDecares: producer.totalDecares ? String(producer.totalDecares) : "",
          sharedDelivery: producer.sharedDelivery,
          deliveryProviders: parseProviders(producer.deliveryProviders),
          logoUrl: producer.logoUrl,
          coverUrl: producer.coverUrl,
          coverPosition: producer.coverPosition ?? 50,
          coverPositionX: producer.coverPositionX ?? 50,
          coverScale: producer.coverScale ?? 100,
        }}
      />
    </div>
  );
}
