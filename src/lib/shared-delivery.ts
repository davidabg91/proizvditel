import { prisma } from "@/lib/prisma";

/**
 * Групи за съвместна доставка.
 *
 * Група се получава по два начина и те се сливат:
 *
 *  1. Изрично партньорство — двете стопанства взаимно са се избрали в
 *     „Партньори". Това е истинската уговорка и важи независимо от града;
 *     Ловеч и Умаревци са на десет километра и спокойно пращат заедно.
 *  2. Един и същи град — двама, които още не са се свързали, но могат.
 *     Оставено като начин да се намерят.
 *
 * По-рано групирането беше само по град и партньорствата не се четяха
 * никъде — затова свързани стопанства от съседни села не се появяваха.
 */

export type GroupListing = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  price: number;
  unit: string;
  currency: string;
};

export type GroupProducer = {
  slug: string;
  farmName: string;
  town: string | null;
  region: string | null;
  logoUrl: string | null;
  crops: string[];
  listings: GroupListing[];
  matching: GroupListing[];
};

export type DeliveryGroup = {
  /** Градът в адреса на групата — /savmestno/[town]. */
  primaryTown: string;
  /** Заглавие: „Ловеч“ или „Ловеч и Умаревци“. */
  title: string;
  towns: string[];
  region: string | null;
  /** Има ли изрично партньорство вътре, или е само съвпадение по град. */
  connected: boolean;
  producers: GroupProducer[];
};

function matchQuery(p: GroupProducer, q: string): boolean {
  const ql = q.toLowerCase();
  if (p.matching.length > 0) return true;
  return p.crops.some((c) => c.toLowerCase().includes(ql));
}

/** Съюз-търсене — слепва стопанствата, свързани по който и да е признак. */
class Groups {
  private parent = new Map<string, string>();

  find(x: string): string {
    const p = this.parent.get(x);
    if (p === undefined) {
      this.parent.set(x, x);
      return x;
    }
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

type RawProducer = {
  id: string;
  slug: string;
  farmName: string;
  town: string | null;
  region: string | null;
  logoUrl: string | null;
  crops: { name: string }[];
  listings: GroupListing[];
};

const producerSelect = {
  id: true,
  slug: true,
  farmName: true,
  town: true,
  region: true,
  logoUrl: true,
  crops: { select: { name: true } },
  listings: {
    where: { available: true, soldOut: false },
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      price: true,
      unit: true,
      currency: true,
    },
  },
};

/** Нормализира град за сравнение — „гр. Ловеч“ и „Ловеч“ са едно и също. */
function townKey(town: string | null): string {
  return (town ?? "")
    .trim()
    .toLowerCase()
    .replace(/^(гр|с|с-це|м|кв)\.\s*/u, "")
    .replace(/\s+/g, " ");
}

/** Взаимните партньорства (A→B и B→A) сред подадените стопанства. */
async function mutualPairs(ids: string[]): Promise<[string, string][]> {
  if (ids.length < 2) return [];
  const links = await prisma.producerPartner.findMany({
    where: { producerId: { in: ids }, partnerId: { in: ids } },
    select: { producerId: true, partnerId: true },
  });
  const seen = new Set(links.map((l) => `${l.producerId}|${l.partnerId}`));
  const pairs: [string, string][] = [];
  for (const l of links) {
    // Взимаме двойката веднъж — само от посоката с по-малкото id.
    if (l.producerId < l.partnerId && seen.has(`${l.partnerId}|${l.producerId}`)) {
      pairs.push([l.producerId, l.partnerId]);
    }
  }
  return pairs;
}

/**
 * Строи групите от списък стопанства и взаимните им партньорства.
 * Без заявки — за да може да се провери самостоятелно.
 */
export function buildGroups(
  raw: RawProducer[],
  pairs: [string, string][],
): DeliveryGroup[] {
  const byId = new Map(raw.map((p) => [p.id, p]));
  const groups = new Groups();
  for (const p of raw) groups.find(p.id);

  const partnered = new Set<string>();
  for (const [a, b] of pairs) {
    groups.union(a, b);
    partnered.add(a);
    partnered.add(b);
  }

  // Един и същи град също слепва — за тези, които още не са партньори.
  const byTown = new Map<string, string[]>();
  for (const p of raw) {
    const key = townKey(p.town);
    if (!key) continue;
    const list = byTown.get(key) ?? [];
    list.push(p.id);
    byTown.set(key, list);
  }
  for (const list of byTown.values()) {
    for (let i = 1; i < list.length; i++) groups.union(list[0], list[i]);
  }

  const members = new Map<string, string[]>();
  for (const p of raw) {
    const root = groups.find(p.id);
    const list = members.get(root) ?? [];
    list.push(p.id);
    members.set(root, list);
  }

  const result: DeliveryGroup[] = [];
  for (const ids of members.values()) {
    if (ids.length < 2) continue;
    const ps = ids.map((id) => byId.get(id)!).filter(Boolean);

    // Градът за адреса: този с най-много стопанства, при равенство — по азбука.
    // Броим по нормализиран ключ, за да не излезе „гр. Ловеч и Ловеч“ като две
    // различни места; за показване остава изписването, което човекът е въвел.
    const byKey = new Map<string, { display: string; count: number }>();
    for (const p of ps) {
      const t = p.town?.trim();
      if (!t) continue;
      const key = townKey(t);
      const cur = byKey.get(key);
      if (cur) cur.count++;
      else byKey.set(key, { display: t, count: 1 });
    }
    const towns = [...byKey.values()]
      .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display, "bg"))
      .map((v) => v.display);
    if (towns.length === 0) continue; // без нито един град няма как да се адресира

    result.push({
      primaryTown: towns[0],
      title:
        towns.length === 1
          ? towns[0]
          : towns.length === 2
            ? `${towns[0]} и ${towns[1]}`
            : `${towns[0]}, ${towns[1]} и още ${towns.length - 2}`,
      towns,
      region: ps.find((p) => p.region)?.region ?? null,
      connected: ids.some((id) => partnered.has(id)),
      producers: ps.map((p) => ({
        slug: p.slug,
        farmName: p.farmName,
        town: p.town,
        region: p.region,
        logoUrl: p.logoUrl,
        crops: p.crops.map((c) => c.name),
        listings: p.listings,
        matching: [],
      })),
    });
  }

  // Първо изрично свързаните, после по големина.
  result.sort(
    (a, b) =>
      Number(b.connected) - Number(a.connected) ||
      b.producers.length - a.producers.length,
  );
  return result;
}

/** Всички групи за съвместна доставка. При q оставя само съвпадащите. */
export async function getDeliveryGroups(q?: string): Promise<DeliveryGroup[]> {
  const raw = await prisma.producer.findMany({
    where: { published: true, sharedDelivery: true },
    orderBy: { createdAt: "desc" },
    select: producerSelect,
  });

  const pairs = await mutualPairs(raw.map((p) => p.id));
  const groups = buildGroups(raw, pairs);
  const ql = q?.trim().toLowerCase() ?? "";
  if (!ql) return groups;

  for (const g of groups) {
    for (const p of g.producers) {
      p.matching = p.listings.filter(
        (l) =>
          l.title.toLowerCase().includes(ql) ||
          (l.category?.toLowerCase().includes(ql) ?? false),
      );
    }
  }
  return groups.filter((g) => g.producers.some((p) => matchQuery(p, ql)));
}

/**
 * Групата, в която попада този град. Връща цялата група, включително
 * стопанствата от други села — те са част от същата уговорка.
 */
export async function getTownGroup(town: string): Promise<DeliveryGroup | null> {
  const groups = await getDeliveryGroups();
  const key = townKey(town);
  return (
    groups.find((g) => g.towns.some((t) => townKey(t) === key)) ?? null
  );
}

/**
 * Близки стопанства за комбиниране: партньорите плюс тези от същия град.
 * Ползва се при подсказките в таблото.
 */
export async function getNearbySharedProducers(
  producerId: string,
  town: string | null,
) {
  const partners = await prisma.producerPartner.findMany({
    where: { producerId },
    select: { partnerId: true },
  });
  const partnerIds = partners.map((p) => p.partnerId);

  return prisma.producer.findMany({
    where: {
      published: true,
      sharedDelivery: true,
      id: { not: producerId },
      OR: [
        { id: { in: partnerIds } },
        ...(town ? [{ town: { equals: town } }] : []),
      ],
    },
    take: 8,
    select: { slug: true, farmName: true, logoUrl: true, town: true },
  });
}
