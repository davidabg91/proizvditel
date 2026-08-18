import { prisma } from "@/lib/prisma";
import { NewsManager } from "./news-manager";
import { CollectButton } from "./collect-button";
import { formatRelative } from "@/lib/utils";
import { SEED_NEWS } from "@/lib/news-seed";

export default async function AdminNewsPage() {
  const [items, lastAi, seedCount] = await Promise.all([
    prisma.newsItem.findMany({
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.newsItem.findFirst({
      where: { aiGenerated: true },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.newsItem.count({
      where: { slug: { in: SEED_NEWS.map((n) => n.slug) } },
    }),
  ]);

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
    aiGenerated: n.aiGenerated,
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
      <CollectButton
        lastRun={lastAi ? formatRelative(lastAi.createdAt) : null}
        seedCount={seedCount}
      />

      <NewsManager items={rows} />
    </div>
  );
}
