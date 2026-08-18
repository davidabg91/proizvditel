import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

/**
 * Пренасяне на старите снимки от базата към Vercel Blob.
 *
 * Преди Blob-а качването падаше обратно към data: URL и записваше цялата
 * снимка като текст в базата. Заради това профилни страници тежаха по няколко
 * мегабайта, а Server Action-ите удряха лимита за тяло на заявката. Кодът вече
 * не пише така (виж api/upload/route.ts), но старите редове останаха.
 *
 * Работи на порции — Vercel Hobby спира функция след 60 секунди, а една
 * снимка се качва за секунда-две. Извиква се, докато `remaining` стане 0.
 */

/** Колко реда се обработват в едно пускане. */
const BATCH = 12;

export type MigrationResult = {
  moved: number;
  failed: number;
  remaining: number;
  errors: string[];
};

type Target = {
  /** Човешко име за съобщенията. */
  label: string;
  count: () => Promise<number>;
  take: (n: number) => Promise<{ id: string; url: string }[]>;
  save: (id: string, url: string) => Promise<unknown>;
};

const DATA_PREFIX = "data:";

const targets: Target[] = [
  {
    label: "снимка на стопанство",
    count: () => prisma.photo.count({ where: { url: { startsWith: DATA_PREFIX } } }),
    take: (n) =>
      prisma.photo.findMany({
        where: { url: { startsWith: DATA_PREFIX } },
        select: { id: true, url: true },
        take: n,
      }),
    save: (id, url) => prisma.photo.update({ where: { id }, data: { url } }),
  },
  {
    label: "снимка на обява",
    count: () =>
      prisma.listingPhoto.count({ where: { url: { startsWith: DATA_PREFIX } } }),
    take: (n) =>
      prisma.listingPhoto.findMany({
        where: { url: { startsWith: DATA_PREFIX } },
        select: { id: true, url: true },
        take: n,
      }),
    save: (id, url) => prisma.listingPhoto.update({ where: { id }, data: { url } }),
  },
  {
    label: "лого",
    count: () =>
      prisma.producer.count({ where: { logoUrl: { startsWith: DATA_PREFIX } } }),
    take: async (n) => {
      const rows = await prisma.producer.findMany({
        where: { logoUrl: { startsWith: DATA_PREFIX } },
        select: { id: true, logoUrl: true },
        take: n,
      });
      return rows.map((r) => ({ id: r.id, url: r.logoUrl! }));
    },
    save: (id, url) => prisma.producer.update({ where: { id }, data: { logoUrl: url } }),
  },
  {
    label: "корица",
    count: () =>
      prisma.producer.count({ where: { coverUrl: { startsWith: DATA_PREFIX } } }),
    take: async (n) => {
      const rows = await prisma.producer.findMany({
        where: { coverUrl: { startsWith: DATA_PREFIX } },
        select: { id: true, coverUrl: true },
        take: n,
      });
      return rows.map((r) => ({ id: r.id, url: r.coverUrl! }));
    },
    save: (id, url) => prisma.producer.update({ where: { id }, data: { coverUrl: url } }),
  },
  {
    label: "регистрационна карта",
    count: () =>
      prisma.producer.count({
        where: { urnDocumentUrl: { startsWith: DATA_PREFIX } },
      }),
    take: async (n) => {
      const rows = await prisma.producer.findMany({
        where: { urnDocumentUrl: { startsWith: DATA_PREFIX } },
        select: { id: true, urnDocumentUrl: true },
        take: n,
      });
      return rows.map((r) => ({ id: r.id, url: r.urnDocumentUrl! }));
    },
    save: (id, url) =>
      prisma.producer.update({ where: { id }, data: { urnDocumentUrl: url } }),
  },
];

/** Колко записа още чакат пренасяне. */
export async function countPendingPhotos(): Promise<number> {
  const counts = await Promise.all(targets.map((t) => t.count()));
  return counts.reduce((a, b) => a + b, 0);
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

/** Разпада „data:image/jpeg;base64,…“ на тип и байтове. */
function parseDataUrl(url: string): { mime: string; buffer: Buffer } | null {
  // [\s\S] вместо флага „s“ — целта на компилатора е под es2018.
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(url);
  if (!match) return null;
  const [, mime, isBase64, payload] = match;
  const buffer = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return buffer.length > 0 ? { mime, buffer } : null;
}

/** Токенът за Blob — при OIDC няма такъв, вж. api/upload/route.ts. */
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find(
    (k) => k.endsWith("_READ_WRITE_TOKEN") && process.env[k],
  );
  return key ? process.env[key] : undefined;
}

/**
 * Пренася до BATCH записа. Връща колко са минали и колко остават, за да може
 * извикващият да пусне отново, без да опира в лимита за време.
 */
export async function migratePhotosToBlob(): Promise<MigrationResult> {
  const errors: string[] = [];
  let moved = 0;
  let failed = 0;
  let budget = BATCH;

  for (const target of targets) {
    if (budget <= 0) break;
    const rows = await target.take(budget);

    for (const row of rows) {
      const parsed = parseDataUrl(row.url);
      if (!parsed) {
        failed++;
        errors.push(`${target.label}: неразпознат data: адрес`);
        continue;
      }

      try {
        const ext = EXT[parsed.mime] ?? "bin";
        const { url } = await put(`migrated/${row.id}.${ext}`, parsed.buffer, {
          access: "public",
          contentType: parsed.mime,
          token: blobToken(),
          addRandomSuffix: true,
        });
        await target.save(row.id, url);
        moved++;
      } catch (e) {
        failed++;
        errors.push(
          `${target.label}: ${e instanceof Error ? e.message : "неуспешно качване"}`,
        );
      }
      budget--;
      if (budget <= 0) break;
    }
  }

  return {
    moved,
    failed,
    remaining: await countPendingPhotos(),
    // Едни и същи грешки се повтарят — стигат няколко за диагноза.
    errors: [...new Set(errors)].slice(0, 5),
  };
}
