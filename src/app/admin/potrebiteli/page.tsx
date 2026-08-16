import { prisma } from "@/lib/prisma";
import { UsersManager } from "./users-manager";

export const metadata = { title: "Потребители · Админ" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
      producer: { select: { slug: true } },
    },
  });

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt.toISOString(),
    producerSlug: u.producer?.slug ?? null,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Потребители</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} регистрирани. Блокирането спира входа и скрива профила на
          производителя.
        </p>
      </div>
      <UsersManager users={rows} />
    </div>
  );
}
