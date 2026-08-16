"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ImageUploader } from "@/components/media/image-uploader";
import { REGIONS, DELIVERY_PROVIDERS } from "@/lib/constants";
import { updateProfile } from "./actions";

type InitialProfile = {
  farmName: string;
  ownerName: string;
  description: string;
  urn: string;
  region: string;
  town: string;
  phone: string;
  contactEmail: string;
  website: string;
  startedYear: string;
  totalDecares: string;
  sharedDelivery: boolean;
  deliveryProviders: string[];
  logoUrl: string | null;
  coverUrl: string | null;
};

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function ProfileForm({ initial }: { initial: InitialProfile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | "saved" | string>(null);

  const [f, setF] = useState(initial);
  const set = (patch: Partial<InitialProfile>) =>
    setF((prev) => ({ ...prev, ...patch }));

  function save() {
    setStatus(null);
    startTransition(async () => {
      const res = await updateProfile({
        farmName: f.farmName.trim(),
        ownerName: f.ownerName.trim(),
        description: f.description.trim(),
        urn: f.urn.trim(),
        region: (f.region as (typeof REGIONS)[number]) || "",
        town: f.town.trim(),
        phone: f.phone.trim(),
        contactEmail: f.contactEmail.trim(),
        website: f.website.trim(),
        startedYear: numOrNull(f.startedYear) as number | null,
        totalDecares: numOrNull(f.totalDecares) as number | null,
        sharedDelivery: f.sharedDelivery,
        deliveryProviders: f.deliveryProviders,
        logoUrl: f.logoUrl ?? "",
        coverUrl: f.coverUrl ?? "",
      });
      if (res.ok) {
        setStatus("saved");
        router.refresh();
      } else {
        setStatus(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Визуална идентичност */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Визуална идентичност</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Логото и снимката на площта се показват в горната част на профила ви.
        </p>
        <div className="mt-5 grid gap-6 sm:grid-cols-[160px_1fr]">
          <div>
            <p className="mb-2 text-sm font-semibold">Лого</p>
            <ImageUploader
              value={f.logoUrl}
              onChange={(url) => set({ logoUrl: url })}
              aspect="square"
              shape="circle"
              label="Лого"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Снимка на площта (корица)</p>
            <ImageUploader
              value={f.coverUrl}
              onChange={(url) => set({ coverUrl: url })}
              aspect="wide"
              label="Снимка на градината / площта"
            />
          </div>
        </div>
      </section>

      {/* Основни данни */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Основни данни</h2>
        <div className="mt-5 flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Име на стопанството">
              <Input
                value={f.farmName}
                onChange={(e) => set({ farmName: e.target.value })}
              />
            </Field>
            <Field label="Собственик">
              <Input
                value={f.ownerName}
                onChange={(e) => set({ ownerName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Представяне на стопанството">
            <Textarea
              value={f.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Разкажете за стопанството си, историята и това, което ви отличава."
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="УРН (зелен картон)">
              <Input value={f.urn} onChange={(e) => set({ urn: e.target.value })} />
            </Field>
            <Field label="От коя година">
              <Input
                inputMode="numeric"
                value={f.startedYear}
                onChange={(e) => set({ startedYear: e.target.value })}
              />
            </Field>
            <Field label="Обща площ (дка)">
              <Input
                inputMode="decimal"
                value={f.totalDecares}
                onChange={(e) => set({ totalDecares: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Локация и контакти */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Локация и контакти</h2>
        <div className="mt-5 flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Област">
              <Select
                value={f.region}
                onChange={(e) => set({ region: e.target.value })}
              >
                <option value="">Изберете област</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Град / село">
              <Input value={f.town} onChange={(e) => set({ town: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Телефон">
              <Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Имейл за контакт">
              <Input
                value={f.contactEmail}
                onChange={(e) => set({ contactEmail: e.target.value })}
              />
            </Field>
            <Field label="Уебсайт / соц. мрежа">
              <Input
                value={f.website}
                onChange={(e) => set({ website: e.target.value })}
                placeholder="по избор"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Съвместна доставка */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Съвместно пазаруване</h2>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={f.sharedDelivery}
            onChange={(e) => set({ sharedDelivery: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-strong text-primary accent-[var(--color-primary)]"
          />
          <span className="text-sm leading-relaxed text-foreground">
            Готов съм да участвам в съвместни доставки с други производители от
            моя град. Така клиентите могат да поръчат от няколко стопанства с една
            обща доставка.
          </span>
        </label>
      </section>

      {/* Доставчици */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Доставчици</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Отбележете с кои куриери и начини на доставка работите. Показват се във
          вашия профил и при продуктите ви.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DELIVERY_PROVIDERS.map((p) => {
            const checked = f.deliveryProviders.includes(p.code);
            return (
              <label
                key={p.code}
                className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3 hover:border-primary/40"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    set({
                      deliveryProviders: e.target.checked
                        ? [...f.deliveryProviders, p.code]
                        : f.deliveryProviders.filter((c) => c !== p.code),
                    })
                  }
                  className="h-5 w-5 rounded border-border-strong accent-[var(--color-primary)]"
                />
                <span
                  className="inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: p.bg, color: p.fg }}
                >
                  {p.name}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Запазване */}
      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface/95 p-4 shadow-md backdrop-blur">
        <div className="text-sm">
          {status === "saved" ? (
            <span className="font-medium text-success">Промените са запазени.</span>
          ) : status ? (
            <span className="font-medium text-danger">{status}</span>
          ) : (
            <span className="text-muted-foreground">Не забравяйте да запазите.</span>
          )}
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? "Запазваме…" : "Запази промените"}
        </Button>
      </div>
    </div>
  );
}
