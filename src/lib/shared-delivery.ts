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
  /** Потвърдена уговорка (взаимно партньорство) или само възможност. */
  confirmed: boolean;
  producers: GroupProducer[];
};

export type DeliveryBoard = {
  /** Взаимно избрали се стопанства — истинска уговорка. */
  confirmed: DeliveryGroup[];
  /** Останалите от областта — могат да изпращат заедно, ако се разберат. */
  potential: DeliveryGroup[];
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

/** Ключ на областта (или на града, ако област не е попълнена). */
function areaKey(p: { region: string | null; town: string | null }): string {
  const region = p.region?.trim().toLowerCase();
  if (region) return `reg:${region}`;
  const t = townKey(p.town);
  return t ? `town:${t}` : "";
}

/** Имената на градовете в група — без повторения от различно изписване. */
function townNames(ps: RawProducer[]): string[] {
  const byKey = new Map<string, { display: string; count: number }>();
  for (const p of ps) {
    const t = p.town?.trim();
    if (!t) continue;
    const key = townKey(t);
    const cur = byKey.get(key);
    if (cur) cur.count++;
    else byKey.set(key, { display: t, count: 1 });
  }
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display, "bg"))
    .map((v) => v.display);
}

function toGroupProducer(p: RawProducer): GroupProducer {
  return {
    slug: p.slug,
    farmName: p.farmName,
    town: p.town,
    region: p.region,
    logoUrl: p.logoUrl,
    crops: p.crops.map((c) => c.name),
    listings: p.listings,
    matching: [],
  };
}

/** Заглавие по областите, а при липсващи — по градовете. */
function groupTitle(regions: string[], towns: string[]): string {
  const list = regions.length > 0 ? regions : towns;
  const prefix = regions.length > 0 ? (regions.length === 1 ? "Област " : "Области ") : "";
  if (list.length === 0) return "";
  if (list.length === 1) return `${prefix}${list[0]}`;
  if (list.length === 2) return `${prefix}${list[0]} и ${list[1]}`;
  return `${prefix}${list[0]}, ${list[1]} и още ${list.length - 2}`;
}

/**
 * Строи таблото от списък стопанства и взаимните им партньорства.
 * Без заявки — за да може да се провери самостоятелно.
 *
 * Потвърдените групи излизат САМО от взаимно партньорство. Групирането по
 * област стои отделно, като „могат да изпращат заедно“ — да пише „изпращат
 * заедно“ за двама, които не са се уговаряли, значи да обещаем на купувача
 * нещо, което никой не е потвърдил.
 */
export function buildBoard(
  raw: RawProducer[],
  pairs: [string, string][],
): DeliveryBoard {
  const byId = new Map(raw.map((p) => [p.id, p]));

  // 1. Потвърдени — свързаните компоненти на партньорствата.
  const groups = new Groups();
  for (const p of raw) groups.find(p.id);
  for (const [a, b] of pairs) groups.union(a, b);

  const members = new Map<string, string[]>();
  for (const p of raw) {
    const root = groups.find(p.id);
    const list = members.get(root) ?? [];
    list.push(p.id);
    members.set(root, list);
  }

  const confirmed: DeliveryGroup[] = [];
  const inConfirmed = new Set<string>();
  const confirmedAreas = new Set<string>();

  for (const ids of members.values()) {
    if (ids.length < 2) continue;
    const ps = ids.map((id) => byId.get(id)!).filter(Boolean);
    const towns = townNames(ps);
    const regions = [
      ...new Set(ps.map((p) => p.region?.trim()).filter(Boolean)),
    ] as string[];
    const region = regions[0] ?? null;
    const key = region ?? towns[0];
    if (!key) continue; // нито област, нито град — няма как да се адресира

    confirmed.push({
      key,
      title: groupTitle(regions, towns),
      towns,
      region,
      confirmed: true,
      producers: ps.map(toGroupProducer),
    });
    for (const p of ps) {
      inConfirmed.add(p.id);
      const a = areaKey(p);
      if (a) confirmedAreas.add(a);
    }
  }

  // 2. Възможни — останалите по области.
  const byArea = new Map<string, RawProducer[]>();
  for (const p of raw) {
    if (inConfirmed.has(p.id)) continue;
    const key = areaKey(p);
    if (!key) continue;
    const list = byArea.get(key) ?? [];
    list.push(p);
    byArea.set(key, list);
  }

  const potential: DeliveryGroup[] = [];
  for (const [key, ps] of byArea) {
    const hasConfirmed = confirmedAreas.has(key);
    // Двама могат да се сдвоят помежду си; един има смисъл само ако в
    // областта вече има потвърдена група, към която да се присъедини.
    if (ps.length < 2 && !hasConfirmed) continue;

    const towns = townNames(ps);
    const regions = [
      ...new Set(ps.map((p) => p.region?.trim()).filter(Boolean)),
    ] as string[];
    const region = regions[0] ?? null;
    const groupKey = region ?? towns[0];
    if (!groupKey) continue;

    potential.push({
      key: groupKey,
      title: groupTitle(regions, towns),
      towns,
      region,
      confirmed: false,
      producers: ps.map(toGroupProducer),
    });
  }

  const bySize = (a: DeliveryGroup, b: DeliveryGroup) =>
    b.producers.length - a.producers.length;
  confirmed.sort(bySize);
  potential.sort(bySize);
  return { confirmed, potential };
}

/** Оставя само групите с намерено съвпадение и маркира съвпадащите обяви. */
function filterByQuery(groups: DeliveryGroup[], ql: string): DeliveryGroup[] {
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

/** Потвърдените и възможните групи. При q оставя само съвпадащите. */
export async function getDeliveryBoard(q?: string): Promise<DeliveryBoard> {
  const raw = await prisma.producer.findMany({
    where: { published: true, sharedDelivery: true },
    orderBy: { createdAt: "desc" },
    select: producerSelect,
  });

  const pairs = await mutualPairs(raw.map((p) => p.id));
  const board = buildBoard(raw, pairs);
  const ql = q?.trim().toLowerCase() ?? "";
  return {
    confirmed: filterByQuery(board.confirmed, ql),
    potential: filterByQuery(board.potential, ql),
  };
}

/** Само потвърдените групи — те имат собствена страница и влизат в картата. */
export async function getDeliveryGroups(): Promise<DeliveryGroup[]> {
  const board = await getDeliveryBoard();
  return board.confirmed;
}

/**
 * Групата зад този адрес. Приема както име на област, така и на град —
 * старите връзки /savmestno/Ловеч продължават да работят. Отваря се само за
 * потвърдени групи: страница „тези изпращат заедно“ за стопанства, които не
 * са се уговаряли, би заблудила купувача.
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
