import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { doSignOut } from "@/lib/auth-actions";
import { getIncomingPartnerRequestCount } from "@/lib/partners";
import { getNewOrdersCount } from "@/app/tablo/porachki/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/vhod");

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const partnerRequests = producer
    ? await getIncomingPartnerRequestCount(producer.id)
    : 0;
  const newOrders = producer ? await getNewOrdersCount(producer.id) : 0;

  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 px-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Управление
          </p>
          <DashboardNav partnerRequests={partnerRequests} newOrders={newOrders} />
          <div className="mt-4 border-t border-border pt-4">
            <form action={doSignOut}>
              <Button variant="ghost" size="sm" type="submit" className="w-full justify-start">
                Изход
              </Button>
            </form>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
