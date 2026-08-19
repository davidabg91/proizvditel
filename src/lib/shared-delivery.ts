import { prisma } from "@/lib/prisma";

/**
 * Групи за съвместна доставка.
 *
 * Група се получава по два начина и те се сливат:
 *
 *  1. Изрично партньорство — двете стопанства взаимно са се избрали в
 *     „Партньори". Това е истинската уговорка и важи навсякъде.
 *  2. Една и съща област — всички стопанства в област Ловеч могат да
 *     изпращат заедно, не само тези в град Ловеч. Разстоянията в една
 *     област са такива, че една обща пратка е напълно реалистична.
 *
 * Стопанство без попълнена област се групира по град — иначе би останало
 * само с изричните си партньори.
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
  /** Каквото стои в адреса — /savmestno/[town]. Областта, ако е попълнена. */
  key: string;
  /** Заглавие: „Област Ловеч“, или списък градове при липсваща област. */
  title: string;
  towns: string[];
  region: string | null;
  /** Има ли изрично партньорство вътре, или е само съвпадение по област. */
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

  // Една и съща област слепва останалите. Ключовете са с представка, за да
  // не се слее област „Ловеч“ със село „Ловеч“ в друга област по случайност.
  const byArea = new Map<string, string[]>();
  for (const p of raw) {
    const region = p.region?.trim().toLowerCase();
    const key = region ? `reg:${region}` : `town:${townKey(p.town)}`;
    if (key === "town:") continue; // нито област, нито град — няма по какво
    const list = byArea.get(key) ?? [];
    list.push(p.id);
    byArea.set(key, list);
  }
  for (const list of byArea.values()) {
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

    // Обикновено областта е една, но изрично партньорство може да събере и
    // съседни области — тогава заглавието трябва да ги назове и двете, а не
    // да представи групата като изцяло от първата.
    const regions = [...new Set(ps.map((p) => p.region?.trim()).filter(Boolean))] as string[];
    const region = regions[0] ?? null;
    // Адресът е областта, когато има такава — тя е обхватът на групата.
    const key = region ?? towns[0];
    if (!key) continue; // нито област, нито град — няма как да се адресира

    result.push({
      key,
      title:
        regions.length === 1
          ? `Област ${regions[0]}`
          : regions.length === 2
            ? `Области ${regions[0]} и ${regions[1]}`
            : regions.length > 2
              ? `Области ${regions[0]}, ${regions[1]} и още ${regions.length - 2}`
              : towns.length === 1
                ? towns[0]
                : towns.length === 2
                  ? `${towns[0]} и ${towns[1]}`
                  : `${towns[0]}, ${towns[1]} и още ${towns.length - 2}`,
      towns,
      region,
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
 * Групата зад този адрес. Приема както име на област, така и на град —
 * старите връзки /savmestno/Ловеч продължават да работят.
 */
export async function getDeliveryGroup(
  param: string,
): Promise<DeliveryGroup | null> {
  const groups = await getDeliveryGroups();
  const key = townKey(param);
  return (
    groups.find(
      (g) =>
        townKey(g.region) === key || g.towns.some((t) => townKey(t) === key),
    ) ?? null
  );
}
