"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ImageUploader } from "@/components/media/image-uploader";
import { DocumentPreviewModal } from "@/components/media/document-preview-modal";
import { REGIONS, DELIVERY_PROVIDERS } from "@/lib/constants";
import { updateProfile } from "./actions";

type InitialProfile = {
  farmName: string;
  ownerName: string;
  description: string;
  urn: string;
  urnVerified?: boolean;
  urnDocumentUrl?: string;
  urnVerificationNote?: string;
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
  coverPosition?: number | null;
  coverPositionX?: number | null;
  coverScale?: number | null;
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
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  const [f, setF] = useState(initial);
  const set = (patch: Partial<InitialProfile>) =>
    setF((prev) => ({ ...prev, ...patch }));

  async function handleDocUpload(file: File) {
    setUploadingDoc(true);
    try {
      const { uploadFile } = await import("@/lib/upload");
      const url = await uploadFile(file);
      set({ urnDocumentUrl: url });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Грешка при качване на документа.");
    } finally {
      setUploadingDoc(false);
    }
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      try {
        const res = await updateProfile({
          farmName: f.farmName.trim(),
          ownerName: f.ownerName.trim(),
          description: f.description.trim(),
          urn: f.urn.trim(),
          urnDocumentUrl: f.urnDocumentUrl || "",
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
          coverPosition: f.coverPosition ?? 50,
          coverPositionX: f.coverPositionX ?? 50,
          coverScale: f.coverScale ?? 100,
        });
        if (res.ok) {
          setStatus("saved");
          router.refresh();
        } else {
          setStatus(res.error);
        }
      } catch (e) {
        console.error("Save profile error:", e);
        setStatus("Възникна грешка при запазването. Моля, опитайте отново.");
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
              imageStyle={{
                objectPosition: `${f.coverPositionX ?? 50}% ${f.coverPosition ?? 50}%`,
                transform: `scale(${(f.coverScale ?? 100) / 100})`,
                transformOrigin: `${f.coverPositionX ?? 50}% ${f.coverPosition ?? 50}%`,
              }}
            />
            {f.coverUrl && (
              <div className="mt-3 flex flex-col gap-3 rounded-[var(--radius-md)] border border-border bg-surface-muted/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Настройка на изгледа (наместване и мащаб)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        coverPosition: 50,
                        coverPositionX: 50,
                        coverScale: 100,
                      })
                    }
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Възстанови по подразбиране
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Мащаб */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">🔍 Мащаб:</span>
                      <span className="font-mono font-medium">{f.coverScale ?? 100}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          set({ coverScale: Math.max(100, (f.coverScale ?? 100) - 10) })
                        }
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-surface text-xs font-bold hover:border-primary"
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min="100"
                        max="250"
                        step="5"
                        value={f.coverScale ?? 100}
                        onChange={(e) => set({ coverScale: Number(e.target.value) })}
                        className="w-full accent-[var(--color-primary)] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set({ coverScale: Math.min(250, (f.coverScale ?? 100) + 10) })
                        }
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-surface text-xs font-bold hover:border-primary"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Вертикално */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">↕️ Вертикално:</span>
                      <span className="font-mono font-medium">{f.coverPosition ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={f.coverPosition ?? 50}
                      onChange={(e) => set({ coverPosition: Number(e.target.value) })}
                      className="w-full accent-[var(--color-primary)] cursor-pointer"
                    />
                  </div>

                  {/* Хоризонтално */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">↔️ Хоризонтално:</span>
                      <span className="font-mono font-medium">{f.coverPositionX ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={f.coverPositionX ?? 50}
                      onChange={(e) => set({ coverPositionX: Number(e.target.value) })}
                      className="w-full accent-[var(--color-primary)] cursor-pointer"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  💡 Можете да намествате и плъзгате корицата свободно с мишката директно през публичния си профил.
                </p>
              </div>
            )}
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
          {/* УРН и Верификация */}
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted/30 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>УРН и Верификация на земеделски производител</span>
                  {f.urnVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                      ✓ Потвърден производител
                    </span>
                  ) : f.urnDocumentUrl ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                      ⏳ Чака преглед от администратор
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                      Непотвърден
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Верифицираните производители получават официална зелена значка на профила и в каталога.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="УРН (Уникален регистрационен номер)"
                hint="6 или 7 цифри от ДФЗ"
              >
                <Input
                  value={f.urn}
                  onChange={(e) => set({ urn: e.target.value.replace(/\D/g, "").slice(0, 7) })}
                  placeholder="напр. 1234567"
                  inputMode="numeric"
                  maxLength={7}
                />
              </Field>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Регистрационна карта (зелен картон)
                </label>
                {f.urnDocumentUrl ? (
                  <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-success/30 bg-success/5 p-2.5 text-xs text-foreground">
                    <button
                      type="button"
                      onClick={() => setShowDocModal(true)}
                      className="font-medium text-primary hover:underline flex items-center gap-1.5 truncate"
                    >
                      <span>📄 Преглед на качената карта</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ urnDocumentUrl: "" })}
                      className="text-danger hover:underline shrink-0"
                    >
                      Смени
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-primary/40 bg-surface p-2.5 text-xs font-semibold text-primary hover:bg-primary-soft transition-colors">
                    <span>{uploadingDoc ? "Качваме документа…" : "📁 Качи регистрационна карта (JPG, PNG или PDF)"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/*,.pdf,.heic,.heif,.HEIC,.HEIF"
                      hidden
                      disabled={uploadingDoc}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="От коя година се занимавате със земеделие">
              <Input
                inputMode="numeric"
                value={f.startedYear}
                onChange={(e) => set({ startedYear: e.target.value })}
                placeholder="напр. 2015"
              />
            </Field>
            <Field label="Обща площ (дка)">
              <Input
                inputMode="decimal"
                value={f.totalDecares}
                onChange={(e) => set({ totalDecares: e.target.value })}
                placeholder="напр. 50"
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

      {showDocModal && f.urnDocumentUrl && (
        <DocumentPreviewModal
          url={f.urnDocumentUrl}
          title={`Регистрационна карта — ${f.farmName || f.ownerName}`}
          onClose={() => setShowDocModal(false)}
        />
      )}
    </div>
  );
}
