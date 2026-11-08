import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/seo/faq-section";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { CATEGORY_LANDINGS } from "@/lib/seo-landing";
import { PageHero } from "@/components/layout/page-hero";

export const revalidate = 3600;

const TITLE = "Сайт за земеделски производители — продавайте продукцията си онлайн";
const DESCRIPTION =
  "Производител.net е безплатен сайт за българските земеделски производители: създайте профил на стопанството, публикувайте обяви и продавайте плодове, зеленчуци, мед и млечни продукти директно на купувачите.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | Производител.net` },
  description: DESCRIPTION,
  alternates: { canonical: "/za-proizvoditeli" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const BENEFITS = [
  {
    title: "Безплатен профил на стопанството",
    text: "Представете кой сте, откога работите, колко декара обработвате и какво отглеждате. Качете снимки от нивата, логото и корицата си.",
  },
  {
    title: "Обяви с цена, количество и оферти",
    text: "Публикувайте продукцията си на дребно и на едро — на килограм, касетка, буркан или тон. Отбелязвайте промоции и изчерпани количества.",
  },
  {
    title: "Плащане с карта или наложен платеж",
    text: "Купувачът плаща онлайн с банкова карта или при доставка. Картовите плащания се превеждат по вашата сметка.",
  },
  {
    title: "Съвместна доставка със съседите",
    text: "Стопанства от едно населено място изпращат поръчките заедно, за да плати купувачът една доставка вместо няколко.",
  },
  {
    title: "Знак „Потвърден производител“",
    text: "Посочете УРН и качете регистрационната си карта. След проверка профилът получава знак, който купувачите виждат навсякъде.",
  },
  {
    title: "Намират ви в Google",
    text: "Всеки профил и всяка обява имат собствен адрес, структурирани данни и място в каталога по категория и област.",
  },
];

const FAQ = [
  {
    q: "Кой е най-добрият сайт за земеделски производители в България?",
    a: "Производител.net е създаден специално за българските земеделски производители, които искат да продават директно на купувачите: безплатен профил, обяви, онлайн плащане с карта, наложен платеж, съвместна доставка и проверка на регистрацията по УРН.",
  },
  {
    q: "Колко струва да продавам в Производител.net?",
    a: "Регистрацията, профилът и обявите са безплатни. При поръчка с наложен платеж не се удържа нищо. При плащане с карта се удържа комисиона за услугата и таксата на платежния доставчик — размерът е посочен в панела на производителя. По желание можете да платите за подсилване на обява, за да излиза на челни позиции.",
  },
  {
    q: "Трябва ли да съм регистриран земеделски производител?",
    a: "Можете да създадете профил и без това, но регистрираните производители могат да посочат УРН и да получат знак „Потвърден производител“, който увеличава доверието на купувачите.",
  },
  {
    q: "Как получавам поръчките?",
    a: "Поръчките и съобщенията от купувачите пристигат в таблото на производителя. Вие потвърждавате поръчката, подготвяте я и я изпращате с куриер или я предавате лично.",
  },
  {
    q: "Какво мога да продавам?",
    a: "Плодове, зеленчуци, зърнени култури, билки и подправки, мед и пчелни продукти, млечни продукти, месо и яйца, ядки, вино и напитки, цветя и разсади — продукция от собственото ви стопанство.",
  },
  {
    q: "Мога ли да продавам на едро?",
    a: "Да. В обявата посочвате мерна единица (включително тон и кашон) и цена, а купувачите на едро могат да ви пишат директно през сайта.",
  },
];

export default async function ForProducersPage() {
  const producerCount = await prisma.producer.count({ where: { published: true } });

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Начало", path: "/" },
          { name: "За производители", path: "/za-proizvoditeli" },
        ]}
      />

      <PageHero
        eyebrow="За земеделски производители"
        title="Сайт за земеделски производители: продавайте директно на купувачите"
        breadcrumbs={[{ label: "За производители" }]}
        description="Производител.net е онлайн пазар, създаден за българските фермери, овощари, градинари, пчелари и животновъди. Създайте безплатен профил на стопанството, публикувайте продукцията си и получавайте поръчки от цяла България — без прекупвачи."
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/registraciya" size="lg" variant="accent">
            Регистрирайте стопанството си безплатно
          </Button>
          <Button
            href="/kak-raboti"
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            Как работи
          </Button>
        </div>
        {producerCount > 0 ? (
          <p className="mt-5 text-sm text-white/70">
            Вече {producerCount}{" "}
            {producerCount === 1 ? "стопанство продава" : "стопанства продават"} през
            платформата.
          </p>
        ) : null}
      </PageHero>

      <div className="container-page py-16">
        <section>
          <h2 className="text-3xl">Какво получавате</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs"
              >
                <h3 className="text-xl font-semibold">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-3xl">Как да започнете да продавате онлайн</h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 leading-relaxed text-foreground/90">
            <li>
              <Link href="/registraciya" className="font-semibold text-primary hover:underline">
                Регистрирайте се
              </Link>{" "}
              като производител — отнема няколко минути.
            </li>
            <li>Попълнете профила: област, населено място, култури, снимки и описание.</li>
            <li>Добавете обяви с цена, мерна единица и наличност.</li>
            <li>Изберете начини на плащане и доставка — карта, наложен платеж, куриер или лично.</li>
            <li>Отговаряйте на съобщенията и изпращайте поръчките.</li>
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl">Категории продукция</h2>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {CATEGORY_LANDINGS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/katalog/${c.slug}`}
                  className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary hover:text-primary"
                >
                  {c.category}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <FaqSection items={FAQ} />

        <section className="mt-16 rounded-[var(--radius-xl)] bg-primary p-10 text-primary-foreground">
          <h2 className="text-3xl text-primary-foreground">Представете стопанството си още днес</h2>
          <p className="mt-3 max-w-xl text-primary-foreground/80">
            Профилът е безплатен. Купувачите ще ви намират по продукция и по област.
          </p>
          <div className="mt-6">
            <Button href="/registraciya" size="lg" variant="accent">
              Започнете безплатно
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
