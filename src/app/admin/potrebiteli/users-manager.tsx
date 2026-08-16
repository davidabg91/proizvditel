"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { setUserBanned } from "../actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
  producerSlug: string | null;
};

export function UsersManager({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();
  const shown = ql
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(ql) || u.email.toLowerCase().includes(ql),
      )
    : users;

  return (
    <div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Търсене по име или имейл…"
        className="mb-4 max-w-sm"
      />
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <ul className="divide-y divide-border">
          {shown.map((u) => (
            <UserItem key={u.id} user={u} />
          ))}
          {shown.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">
              Няма намерени потребители.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function UserItem({ user }: { user: UserRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {user.producerSlug ? (
            <Link href={`/p/${user.producerSlug}`} className="font-semibold hover:text-primary">
              {user.name}
            </Link>
          ) : (
            <span className="font-semibold">{user.name}</span>
          )}
          <Badge tone={user.role === "producer" ? "primary" : user.role === "admin" ? "accent" : "neutral"}>
            {user.role === "producer" ? "Производител" : user.role === "admin" ? "Админ" : "Купувач"}
          </Badge>
          {user.banned ? <Badge tone="danger">Блокиран</Badge> : null}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
      <button
        type="button"
        disabled={pending || user.role === "admin"}
        onClick={() =>
          startTransition(async () => {
            await setUserBanned(user.id, !user.banned);
            router.refresh();
          })
        }
        className={[
          "rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-40",
          user.banned
            ? "border border-border-strong text-foreground hover:border-primary"
            : "bg-danger text-white hover:opacity-90",
        ].join(" ")}
      >
        {user.banned ? "Отблокирай" : "Блокирай"}
      </button>
    </li>
  );
}
