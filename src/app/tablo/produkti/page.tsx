import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListingsManager } from "./listings-manager";

export default async function ManageListingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/vhod");

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      listings: {
        orderBy: { createdAt: "desc" },
        include: { photos: { orderBy: { sort: "asc" } } },
      },
    },
  });
  if (!producer) redirect("/vhod");

  const rows = producer.listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    category: l.category,
    price: l.price,
    oldPrice: l.oldPrice,
    unit: l.unit,
    currency: l.currency,
    available: l.available,
    isOffer: l.isOffer,
    stockNote: l.stockNote,
    photos: l.photos.map((p) => p.url),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Обяви за продажба</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Вашият каталог. Добавяйте продукти със снимки, цени и оферти.
        </p>
      </div>
      <ListingsManager listings={rows} />
    </div>
  );
}
