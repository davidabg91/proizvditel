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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Блог</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Споделяйте полезното за вашите продукти — ползи, качества, съвети и
          рецепти. Статиите се показват в общия блог.
        </p>
      </div>
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
