import { redirect } from "next/navigation";
import { getCurrentProducer } from "@/lib/session";
import { CropsManager } from "./crops-manager";

export default async function ProductionPage() {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Продукция</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Културите, които отглеждате. Показват се обобщено в профила ви.
        </p>
      </div>
      <CropsManager crops={producer.crops} />
    </div>
  );
}
