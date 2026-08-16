"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { setUserBanned, verifyProducerUrn } from "../actions";
import { DocumentPreviewModal } from "@/components/media/document-preview-modal";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
  producerId: string | null;
  producerSlug: string | null;
  farmName: string | null;
  urn: string | null;
  urnVerified: boolean;
  urnDocumentUrl: string | null;
};

export function UsersManager({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending_urn" | "verified_urn">("all");

  const ql = q.trim().toLowerCase();
  let shown = ql
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(ql) ||
          u.email.toLowerCase().includes(ql) ||
          (u.farmName && u.farmName.toLowerCase().includes(ql)) ||
          (u.urn && u.urn.includes(ql)),
      )
    : users;

  if (filter === "pending_urn") {
    shown = shown.filter((u) => u.producerId && u.urn && !u.urnVerified);
  } else if (filter === "verified_urn") {
    shown = shown.filter((u) => u.producerId && u.urnVerified);
  }

  const pendingUrnCount = users.filter((u) => u.producerId && u.urn && !u.urnVerified).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търсене по име, стопанство, имейл или УРН…"
          className="max-w-md"
        />

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={[
              "rounded-full px-3 py-1 font-medium transition-colors",
              filter === "all"
                ? "bg-foreground text-background"
                : "bg-surface-muted text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Всички ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending_urn")}
            className={[
              "rounded-full px-3 py-1 font-medium transition-colors flex items-center gap-1",
              filter === "pending_urn"
                ? "bg-amber-500 text-white"
                : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
            ].join(" ")}
          >
            <span>Чакащи УРН</span>
            {pendingUrnCount > 0 && (
              <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px] font-bold">
                {pendingUrnCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified_urn")}
            className={[
              "rounded-full px-3 py-1 font-medium transition-colors",
              filter === "verified_urn"
                ? "bg-success text-white"
                : "bg-success/10 text-success hover:bg-success/20",
            ].join(" ")}
          >
            Потвърдени ({users.filter((u) => u.urnVerified).length})
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
        <ul className="divide-y divide-border">
          {shown.map((u) => (
            <UserItem key={u.id} user={u} />
          ))}
          {shown.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">
              Няма намерени потребители по зададения критерий.
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
  const [showDocModal, setShowDocModal] = useState(false);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {user.producerSlug ? (
            <Link
              href={`/p/${user.producerSlug}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {user.farmName || user.name}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">{user.name}</span>
          )}

          <Badge
            tone={
              user.role === "producer"
                ? "primary"
                : user.role === "admin"
                  ? "accent"
                  : "neutral"
            }
          >
            {user.role === "producer"
              ? "Производител"
              : user.role === "admin"
                ? "Админ"
                : "Купувач"}
          </Badge>

          {user.banned ? <Badge tone="danger">Блокиран</Badge> : null}

          {/* УРН значка */}
          {user.producerId && user.urn ? (
            user.urnVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success border border-success/30">
                ✓ Потвърден УРН: {user.urn}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 border border-amber-500/30">
                ⏳ УРН: {user.urn} (Чака одобрение)
              </span>
            )
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{user.email}</span>
          {user.farmName && user.farmName !== user.name && (
            <span>Собственик: {user.name}</span>
          )}

          {/* Документ за верификация - Отваря модален прозорец */}
          {user.urnDocumentUrl && (
            <button
              type="button"
              onClick={() => setShowDocModal(true)}
              className="font-semibold text-primary hover:underline inline-flex items-center gap-1 bg-primary-soft/50 px-2 py-0.5 rounded border border-primary/20"
            >
              <span>📄 Преглед на регистрационна карта</span>
            </button>
          )}

          {/* Бърза справка в официален регистър */}
          <a
            href="https://portal.registryagency.bg/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground underline inline-flex items-center gap-1"
            title="Официален портал на Търговския регистър и регистър БУЛСТАТ"
          >
            🏛️ Търговски регистър
          </a>

          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`"земеделски производител" "${user.name}" ${user.farmName ? `"${user.farmName}"` : ""}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground underline inline-flex items-center gap-1"
            title="Търсене в интернет за този земеделски производител"
          >
            🔍 Търсене в Google
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
        {/* Бутони за верификация на УРН */}
        {user.producerId && user.urn && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await verifyProducerUrn(user.producerId!, !user.urnVerified);
                router.refresh();
              })
            }
            className={[
              "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40",
              user.urnVerified
                ? "border border-border text-muted-foreground hover:text-danger hover:border-danger"
                : "bg-success text-white hover:bg-success/90 shadow-sm",
            ].join(" ")}
          >
            {user.urnVerified ? "Отмени УРН" : "✓ Одобри УРН"}
          </button>
        )}

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
            "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40",
            user.banned
              ? "border border-border-strong text-foreground hover:border-primary"
              : "bg-danger text-white hover:opacity-90",
          ].join(" ")}
        >
          {user.banned ? "Отблокирай" : "Блокирай"}
        </button>
      </div>

      {/* Модален прозорец за преглед на картата */}
      {showDocModal && user.urnDocumentUrl && (
        <DocumentPreviewModal
          url={user.urnDocumentUrl}
          title={`Регистрационна карта — ${user.farmName || user.name} (УРН: ${user.urn || "—"})`}
          onClose={() => setShowDocModal(false)}
          actions={
            user.producerId && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await verifyProducerUrn(user.producerId!, !user.urnVerified);
                      setShowDocModal(false);
                      router.refresh();
                    })
                  }
                  className={[
                    "rounded-[var(--radius-sm)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors",
                    user.urnVerified ? "bg-danger hover:bg-danger/90" : "bg-success hover:bg-success/90",
                  ].join(" ")}
                >
                  {user.urnVerified ? "Отмени верификацията на УРН" : "✓ Одобри и верифицирай УРН"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
                >
                  Затвори
                </button>
              </>
            )
          }
        />
      )}
    </li>
  );
}
