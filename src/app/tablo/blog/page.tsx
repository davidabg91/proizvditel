import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BlogManager } from "./blog-manager";

export const metadata = { title: "Моят блог" };

export default async function DashboardBlogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/vhod");

  const posts = await prisma.blogPost.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Блог</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Споделяйте полезното за вашите продукти — ползи, качества, съвети и
          рецепти. Статиите се показват в общия блог.
        </p>
      </div>

      {/* Защо си струва да пишат */}
      <section className="mb-8 rounded-[var(--radius-lg)] border border-primary/25 bg-primary-soft/40 p-5">
        <h2 className="font-semibold">Защо да напишете статия</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          Купувачът в интернет не може да опита стоката, нито да ви погледне в
          очите. Затова търси знак, че отсреща има човек, който разбира. Една
          статия за нещо, което вие правите всеки ден, върши точно това —{" "}
          <strong>показва знание, а знанието поражда доверие</strong>.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface p-3.5">
            <p className="text-sm font-semibold">Визитка на стопанството</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Под всяка ваша статия излиза стопанството ви — лого, оценки, какво
              отглеждате и <strong>три от актуалните ви обяви с цени</strong>.
              Човек, който току-що е прочел нещо полезно от вас, е на една стъпка
              от поръчката.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface p-3.5">
            <p className="text-sm font-semibold">Хора ви намират от Google</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Обявата ви я вижда този, който вече е в сайта. Статията я намира и
              онзи, който търси „кога е сезонът на ягодите“ — и така стига до вас,
              без да ви е познавал.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface p-3.5">
            <p className="text-sm font-semibold">Работи, докато спите</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Написана веднъж, статията продължава да води хора месеци и години
              наред. Всеки сезон я намират нови купувачи.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface p-3.5">
            <p className="text-sm font-semibold">Пишете за което разбирате</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Не е нужно да сте писател. Разкажете как познавате зрелия плод, кога
              берете, как се съхранява, какво правите при слана. Точно това никой
              друг не може да напише вместо вас.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] border border-border/70 bg-surface p-3.5">
          <p className="text-sm font-semibold">Теми, които се търсят целогодишно</p>
          <ul className="mt-1.5 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <li>• Как да познаем качествен [вашият продукт]</li>
            <li>• Кога е сезонът и защо има значение</li>
            <li>• Как се съхранява правилно</li>
            <li>• Как минава един ден в стопанството</li>
            <li>• Рецепта, за която го използвате вкъщи</li>
            <li>• Разлика между вашия начин и масовия</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Един-два абзаца стигат. По-важно е да е ваше и вярно, отколкото дълго.
          </p>
        </div>
      </section>
      <BlogManager
        posts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          excerpt: p.excerpt,
          body: p.body,
          coverUrl: p.coverUrl,
          published: p.published,
        }))}
      />
    </div>
  );
}
