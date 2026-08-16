import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/layout/admin-nav";

export const metadata = { title: "Админ панел" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/");

  const openReports = await prisma.report.count({ where: { status: "open" } });

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 px-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Администрация
          </p>
          <AdminNav openReports={openReports} />
          <div className="mt-4 border-t border-border pt-4">
            <Link
              href="/"
              className="px-3.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← Към сайта
            </Link>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
