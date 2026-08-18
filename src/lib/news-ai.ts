import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

/**
 * Автоматично събиране на агро новини и събития.
 *
 * Claude търси в мрежата и връща находките през инструмент със схема —
 * не искаме свободен текст, който после да гадаем. Дубликатите се спират
 * на два слоя: моделът получава списък с вече записаното и му е указано да
 * го пропуска, а после кодът сравнява самостоятелно, защото същото събитие
 * се среща формулирано различно от различни източници.
 */

const MODEL = "claude-opus-5";

/** Колко назад да гледаме за дубликати. */
const DUPLICATE_WINDOW_DAYS = 400;

export type CollectResult = {
  ok: boolean;
  found: number;
  created: number;
  skipped: number;
  archived: number;
  error?: string;
};

type Candidate = {
  title: string;
  summary: string;
  category: string;
  eventDate?: string | null;
  eventEndDate?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
};

// ─────────────────────────────────────────────
//  Разпознаване на дубликати
// ─────────────────────────────────────────────

/** Думи, които не носят смисъл при сравнение на заглавия. */
const STOP_WORDS = new Set([
  "на", "в", "за", "и", "от", "по", "с", "със", "до", "при", "през",
  "the", "of", "in", "for", "and",
  "изложение", "панаир", "форум", "конференция", "семинар", "обучение",
  "международно", "международен", "национална", "национален", "българия",
]);

/** Свежда заглавие до значещите му думи — за сравнение, не за показване. */
function keyWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[„“"'’.,:;!?()\-–—/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

/** Дял на общите думи спрямо по-малкото множество (0..1). */
function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return common / Math.min(a.size, b.size);
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

type Existing = {
  title: string;
  eventDate: Date | null;
  location: string | null;
  sourceUrl: string | null;
  words: Set<string>;
};

/**
 * Дали кандидатът вече го има. Едно и също събитие от друг източник е
 * формулирано различно, затова не сравняваме низовете буквално.
 */
function isDuplicate(candidate: Candidate, existing: Existing[]): boolean {
  const url = candidate.sourceUrl?.trim().toLowerCase();
  const words = keyWords(candidate.title);
  const date = candidate.eventDate ? new Date(candidate.eventDate) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const loc = candidate.location?.trim().toLowerCase() ?? "";

  for (const item of existing) {
    // Същият източник — със сигурност същото
    if (url && item.sourceUrl?.trim().toLowerCase() === url) return true;

    const titleMatch = overlap(words, item.words);

    // Много близки заглавия
    if (titleMatch >= 0.75) return true;

    // Умерено близки, но същият ден — почти сигурно същото събитие,
    // описано с други думи от друг източник.
    if (titleMatch >= 0.4 && sameDay(validDate, item.eventDate)) return true;

    // Същият ден и същото място, независимо от заглавието
    if (
      validDate &&
      sameDay(validDate, item.eventDate) &&
      loc &&
      item.location &&
      overlap(keyWords(loc), keyWords(item.location)) >= 0.5
    ) {
      return true;
    }
  }

  return false;
}

// ─────────────────────────────────────────────
//  Заявка към модела
// ─────────────────────────────────────────────

const REPORT_TOOL: Anthropic.Tool = {
  name: "report_items",
  description:
    "Подава намерените новини и предстоящи събития. Извиква се веднъж, след като търсенето приключи.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description:
          "Намерените новини и събития. Празен масив, ако няма нищо ново.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Заглавие на български" },
            summary: {
              type: "string",
              description:
                "2-3 изречения на български: какво е и защо е важно за земеделски производител.",
            },
            category: { type: "string", enum: [...NEWS_CATEGORIES] },
            eventDate: {
              type: "string",
              description:
                "Начална дата на събитието във формат ГГГГ-ММ-ДД. Празно, ако е новина без дата.",
            },
            eventEndDate: {
              type: "string",
              description: "Крайна дата ГГГГ-ММ-ДД, ако е няколкодневно.",
            },
            location: { type: "string", description: "Населено място и място на провеждане." },
            sourceUrl: { type: "string", description: "Пряк адрес към първоизточника." },
            sourceName: { type: "string", description: "Име на източника." },
          },
          required: ["title", "summary", "category"],
        },
      },
    },
    required: ["items"],
  },
};

function buildPrompt(existing: Existing[], today: string): string {
  const list =
    existing.length > 0
      ? existing
          .slice(0, 120)
          .map((e) => {
            const d = e.eventDate ? e.eventDate.toISOString().slice(0, 10) : "без дата";
            return `- ${e.title} (${d}${e.location ? `, ${e.location}` : ""})`;
          })
          .join("\n")
      : "(няма записани)";

  return `Днес е ${today}.

Потърси в мрежата актуални новини и ПРЕДСТОЯЩИ събития за българските земеделски производители.

Какво търся:
- Изложения, панаири и борси за земеделие в България
- Обучения, семинари и информационни дни за фермери
- Отворени приеми по програми и субсидии (ДФ Земеделие, Стратегическия план, ПРСР)
- Съществени новини за пазара и изкупните цени на земеделска продукция

Строги изисквания:
1. САМО неща, свързани със земеделие, животновъдство, пчеларство и хранително-вкусова промишленост в България. Нищо друго.
2. САМО събития с дата ОТ ${today} НАТАТЪК. Отминалите не ме интересуват — пропусни ги.
3. Всяка находка трябва да има проверим първоизточник (sourceUrl). Ако не си сигурен в датата, не я включвай изобщо.
4. Не измисляй. По-добре два сигурни резултата, отколкото десет предположения.
5. Пиши на български, естествено и кратко.

ВЕЧЕ ЗАПИСАНИ в сайта — НЕ ги повтаряй, дори ако намериш същото събитие описано с други думи, от друг източник или с друго заглавие:
${list}

Ако дадено събитие вече е в списъка отгоре, просто го пропусни. Търся само нови неща.

Намери до 8 находки и ги подай наведнъж през инструмента report_items. Ако няма нищо ново — подай празен масив.`;
}

/** Извлича находките от отговора — през инструмента, не от свободен текст. */
function extractItems(content: Anthropic.ContentBlock[]): Candidate[] {
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "report_items") {
      const input = block.input as { items?: unknown };
      if (Array.isArray(input?.items)) return input.items as Candidate[];
    }
  }
  return [];
}

// ─────────────────────────────────────────────
//  Основната работа
// ─────────────────────────────────────────────

function toDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "novina";
  let slug = base;
  for (let i = 2; i < 60; i++) {
    const taken = await prisma.newsItem.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function collectNews(): Promise<CollectResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      found: 0,
      created: 0,
      skipped: 0,
      archived: 0,
      error: "Липсва ANTHROPIC_API_KEY.",
    };
  }

  const author = await prisma.user.findFirst({
    where: { role: { in: ["admin", "producer"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!author) {
    return {
      ok: false,
      found: 0,
      created: 0,
      skipped: 0,
      archived: 0,
      error: "Няма потребител, на когото да се запишат новините.",
    };
  }

  const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await prisma.newsItem.findMany({
    where: { createdAt: { gte: since } },
    select: { title: true, eventDate: true, location: true, sourceUrl: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const existing: Existing[] = rows.map((r) => ({ ...r, words: keyWords(r.title) }));

  const today = new Date().toISOString().slice(0, 10);
  const client = new Anthropic({ apiKey });

  let candidates: Candidate[] = [];
  try {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildPrompt(existing, today) },
    ];

    // Търсенето в мрежата може да опре в лимита за обиколки — тогава
    // отговорът се връща с pause_turn и заявката се продължава.
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "medium" },
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 12 },
          REPORT_TOOL,
        ],
        messages,
      });

      const items = extractItems(response.content);
      if (items.length > 0 || response.stop_reason !== "pause_turn") {
        candidates = items;
        break;
      }

      messages.push({ role: "assistant", content: response.content });
    }
  } catch (error) {
    console.error("collectNews model error:", error);
    return {
      ok: false,
      found: 0,
      created: 0,
      skipped: 0,
      archived: 0,
      error: error instanceof Error ? error.message : "Грешка при заявката.",
    };
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const autoPublish = process.env.NEWS_AI_AUTOPUBLISH !== "false";

  let created = 0;
  let skipped = 0;

  for (const item of candidates) {
    const title = item.title?.trim();
    const summary = item.summary?.trim();
    if (!title || !summary) {
      skipped++;
      continue;
    }

    const category = NEWS_CATEGORIES.find((c) => c === item.category) ?? "Друго";
    const eventDate = toDate(item.eventDate);

    // Отминалите събития не влизат, каквото и да е върнал моделът.
    if (eventDate && eventDate < startOfToday) {
      skipped++;
      continue;
    }

    if (isDuplicate(item, existing)) {
      skipped++;
      continue;
    }

    try {
      await prisma.newsItem.create({
        data: {
          slug: await uniqueSlug(title),
          title,
          summary,
          category,
          eventDate,
          eventEndDate: toDate(item.eventEndDate),
          location: item.location?.trim() || null,
          sourceUrl: item.sourceUrl?.trim() || null,
          sourceName: item.sourceName?.trim() || null,
          authorId: author.id,
          aiGenerated: true,
          published: autoPublish,
        },
      });
      created++;

      // Новото веднага става част от сравнението, за да не се дублира
      // в рамките на същото пускане.
      existing.unshift({
        title,
        eventDate,
        location: item.location?.trim() || null,
        sourceUrl: item.sourceUrl?.trim() || null,
        words: keyWords(title),
      });
    } catch (error) {
      console.error("collectNews create error:", error);
      skipped++;
    }
  }

  // Събития, отминали преди повече от 30 дни, слизат от сайта.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count: archived } = await prisma.newsItem.updateMany({
    where: { published: true, eventDate: { lt: cutoff } },
    data: { published: false },
  });

  return { ok: true, found: candidates.length, created, skipped, archived };
}
