import { prisma } from "@/lib/prisma";
import { NewsManager } from "./news-manager";

export default async function AdminNewsPage() {
  const items = await prisma.newsItem.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });

  const rows = items.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    body: n.body,
    category: n.category,
    eventDate: n.eventDate ? n.eventDate.toISOString() : null,
    eventEndDate: n.eventEndDate ? n.eventEndDate.toISOString() : null,
    location: n.location,
    sourceUrl: n.sourceUrl,
    sourceName: n.sourceName,
    coverUrl: n.coverUrl,
    published: n.published,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Новини и събития</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Изложения, панаири, обучения и програми за земеделските производители.
          Събитията с бъдеща дата излизат най-отгоре в раздел „Предстоящи“.
        </p>
      </div>
      <NewsManager items={rows} />
    </div>
  );
}
