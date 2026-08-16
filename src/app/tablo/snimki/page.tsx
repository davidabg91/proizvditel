import { redirect } from "next/navigation";
import { getCurrentProducer } from "@/lib/session";
import { PhotosManager } from "./photos-manager";

export default async function PhotosPage() {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Снимки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Добрите снимки печелят доверие. Качете изгледи от площта и продукцията.
        </p>
      </div>
      <PhotosManager
        photos={producer.photos.map((p) => ({
          id: p.id,
          url: p.url,
          type: p.type,
          caption: p.caption,
        }))}
      />
    </div>
  );
}
