"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { REGIONS, CATEGORIES, YIELD_UNITS } from "@/lib/constants";
import { registerProducer } from "./actions";

import { uploadFile } from "@/lib/upload";
import { validateUrnFormat } from "@/lib/validators";

type Crop = {
  name: string;
  category: string;
  varieties: string;
  sinceYear: string;
  decares: string;
  annualYield: string;
  yieldUnit: string;
};

const emptyCrop = (): Crop => ({
  name: "",
  category: "",
  varieties: "",
  sinceYear: "",
  decares: "",
  annualYield: "",
  yieldUnit: "кг",
});

const STEPS = ["Акаунт", "Данни за стопанството", "Продукция", "Преглед"];

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function RegisterWizard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Акаунт
  const [farmName, setFarmName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Данни за ЗП
  const [urn, setUrn] = useState("");
  const [urnDocumentUrl, setUrnDocumentUrl] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [region, setRegion] = useState("");
  const [town, setTown] = useState("");
  const [startedYear, setStartedYear] = useState("");
  const [totalDecares, setTotalDecares] = useState("");
  const [description, setDescription] = useState("");

  // Продукция
  const [crops, setCrops] = useState<Crop[]>([emptyCrop()]);

  const updateCrop = (i: number, patch: Partial<Crop>) =>
    setCrops((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addCrop = () => setCrops((prev) => [...prev, emptyCrop()]);
  const removeCrop = (i: number) =>
    setCrops((prev) => prev.filter((_, idx) => idx !== i));

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (farmName.trim().length < 2) return "Въведете име на стопанството.";
      if (ownerName.trim().length < 2) return "Въведете име на собственика.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return "Въведете валиден имейл адрес.";
      if (password.length < 8) return "Паролата трябва да е поне 8 символа.";
    }
    if (s === 1) {
      if (urn.trim()) {
        const urnCheck = validateUrnFormat(urn);
        if (!urnCheck.valid) return urnCheck.error ?? "Невалиден УРН.";
      }
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleDocUpload(file: File) {
    setUploadingDoc(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      setUrnDocumentUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при качване на документа.");
    } finally {
      setUploadingDoc(false);
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registerProducer({
        farmName: farmName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        urn: urn.trim(),
        urnDocumentUrl: urnDocumentUrl || undefined,
        region: (region as (typeof REGIONS)[number]) || "",
        town: town.trim(),
        startedYear: numOrNull(startedYear) as number | null,
        totalDecares: numOrNull(totalDecares) as number | null,
        description: description.trim(),
        crops: crops
          .filter((c) => c.name.trim())
          .map((c) => ({
            name: c.name.trim(),
            category: (c.category as (typeof CATEGORIES)[number]) || "",
            varieties: c.varieties.trim(),
            sinceYear: numOrNull(c.sinceYear) as number | null,
            decares: numOrNull(c.decares) as number | null,
            annualYield: numOrNull(c.annualYield) as number | null,
            yieldUnit: (c.yieldUnit as (typeof YIELD_UNITS)[number]) || "",
          })),
      });

      if (res.ok) {
        router.push("/tablo");
        router.refresh();
      } else {
        setError(res.error);
        setStep(0);
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Стъпки */}
      <ol className="mb-10 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const state =
            i < step ? "done" : i === step ? "current" : "upcoming";
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    state === "done"
                      ? "bg-primary text-primary-foreground"
                      : state === "current"
                        ? "bg-primary/10 text-primary ring-2 ring-primary"
                        : "bg-surface-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {i + 1}
                </span>
                <span
                  className={[
                    "hidden text-sm font-medium sm:block",
                    state === "upcoming"
                      ? "text-muted-foreground"
                      : "text-foreground",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <span className="h-px flex-1 bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <div className="mb-6 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      {/* Стъпка 1 — Акаунт */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-serif text-2xl">Създайте акаунт</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Основни данни за вход и за вашето стопанство.
            </p>
          </div>
          <Field label="Име на стопанството" htmlFor="farmName">
            <Input
              id="farmName"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="напр. Стопанство „Слънчева градина“"
            />
          </Field>
          <Field label="Име на собственика" htmlFor="ownerName">
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Име и фамилия"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Имейл" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vie@email.bg"
                autoComplete="email"
              />
            </Field>
            <Field label="Телефон" htmlFor="phone" hint="по избор">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0888 123 456"
              />
            </Field>
          </div>
          <Field
            label="Парола"
            htmlFor="password"
            description="Поне 8 символа."
          >
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
      )}

      {/* Стъпка 2 — Данни за стопанството */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-serif text-2xl">Данни за стопанството</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ще ги обобщим в профила ви. Всичко може да се редактира по-късно.
            </p>
          </div>
          <Field
            label="УРН (Уникален регистрационен номер)"
            htmlFor="urn"
            description="6 или 7-цифреният номер от ДФЗ / МЗХ (Наредба №3). По избор."
          >
            <Input
              id="urn"
              value={urn}
              onChange={(e) => setUrn(e.target.value.replace(/\D/g, "").slice(0, 7))}
              placeholder="напр. 1234567"
              inputMode="numeric"
              maxLength={7}
            />
          </Field>

          {/* Качване на регистрационна карта за значка "Потвърден производител" */}
          <div className="rounded-[var(--radius-md)] border border-primary/20 bg-primary-soft/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-primary font-bold">✓</span> Регистрационна карта от МЗХ / ДФЗ
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Качете снимка или PDF на вашата Регистрационна карта (зелен картон). След преглед от администратор получавате официална зелена значка <strong>„✓ Потвърден производител“</strong> в сайта.
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {urnDocumentUrl ? (
                <div className="flex items-center gap-2 rounded bg-surface px-3 py-1.5 text-xs font-medium text-success border border-success/30">
                  <span>✓ Документът е качен успешно</span>
                  <button
                    type="button"
                    onClick={() => setUrnDocumentUrl("")}
                    className="text-danger hover:underline ml-2"
                  >
                    Премахни
                  </button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-primary/40 bg-surface px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft transition-colors">
                  <span>📄 {uploadingDoc ? "Качваме документа…" : "Качи регистрационна карта (JPG, PNG или PDF)"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*,.pdf,.heic,.heif,.HEIC,.HEIF"
                    hidden
                    disabled={uploadingDoc}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload(f);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Област" htmlFor="region">
              <Select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Изберете област</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Град / село" htmlFor="town">
              <Input
                id="town"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="напр. Пловдив"
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="От коя година се занимавате със земеделие"
              htmlFor="startedYear"
              hint="по избор"
            >
              <Input
                id="startedYear"
                inputMode="numeric"
                value={startedYear}
                onChange={(e) => setStartedYear(e.target.value)}
                placeholder="напр. 2015"
              />
            </Field>
            <Field
              label="Обща обработваема площ (декари)"
              htmlFor="totalDecares"
              hint="по избор"
            >
              <Input
                id="totalDecares"
                inputMode="decimal"
                value={totalDecares}
                onChange={(e) => setTotalDecares(e.target.value)}
                placeholder="напр. 120"
              />
            </Field>
          </div>
          <Field
            label="Кратко представяне"
            htmlFor="description"
            description="Разкажете накратко за стопанството си — какво ви отличава."
          >
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Семейно стопанство, което отглежда..."
            />
          </Field>
        </div>
      )}

      {/* Стъпка 3 — Продукция */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-serif text-2xl">Какво произвеждате?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Добавете културите, които отглеждате. Можете да добавите колкото
              желаете.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {crops.map((crop, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Култура {i + 1}
                  </span>
                  {crops.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeCrop(i)}
                      className="text-sm font-medium text-danger hover:underline"
                    >
                      Премахни
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Какво произвеждате">
                      <Input
                        value={crop.name}
                        onChange={(e) => updateCrop(i, { name: e.target.value })}
                        placeholder="напр. Ягоди"
                      />
                    </Field>
                    <Field label="Категория">
                      <Select
                        value={crop.category}
                        onChange={(e) =>
                          updateCrop(i, { category: e.target.value })
                        }
                      >
                        <option value="">Изберете</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field
                    label="Сортове или видове"
                    hint="по избор"
                    description="Изредете сортовете, разделени със запетая."
                  >
                    <Input
                      value={crop.varieties}
                      onChange={(e) =>
                        updateCrop(i, { varieties: e.target.value })
                      }
                      placeholder="напр. Клери, Албион, Мармолада"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="От коя година" hint="по избор">
                      <Input
                        inputMode="numeric"
                        value={crop.sinceYear}
                        onChange={(e) =>
                          updateCrop(i, { sinceYear: e.target.value })
                        }
                        placeholder="напр. 2018"
                      />
                    </Field>
                    <Field label="Площ (декари)" hint="по избор">
                      <Input
                        inputMode="decimal"
                        value={crop.decares}
                        onChange={(e) =>
                          updateCrop(i, { decares: e.target.value })
                        }
                        placeholder="напр. 15"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <Field label="Годишна продукция" hint="по избор">
                      <Input
                        inputMode="decimal"
                        value={crop.annualYield}
                        onChange={(e) =>
                          updateCrop(i, { annualYield: e.target.value })
                        }
                        placeholder="напр. 8"
                      />
                    </Field>
                    <Field label="Мерна единица">
                      <Select
                        value={crop.yieldUnit}
                        onChange={(e) =>
                          updateCrop(i, { yieldUnit: e.target.value })
                        }
                      >
                        {YIELD_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Button type="button" variant="outline" onClick={addCrop}>
              + Добави още култура
            </Button>
          </div>
        </div>
      )}

      {/* Стъпка 4 — Преглед */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-serif text-2xl">Преглед</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Проверете данните и завършете регистрацията.
            </p>
          </div>

          <ReviewBlock title="Стопанство">
            <ReviewRow label="Име" value={farmName} />
            <ReviewRow label="Собственик" value={ownerName} />
            <ReviewRow label="Имейл" value={email} />
            <ReviewRow label="Телефон" value={phone} />
          </ReviewBlock>

          <ReviewBlock title="Данни за ЗП">
            <ReviewRow label="УРН" value={urn} />
            <ReviewRow label="Област" value={region} />
            <ReviewRow label="Град / село" value={town} />
            <ReviewRow label="Занимава се от" value={startedYear} />
            <ReviewRow
              label="Обща площ"
              value={totalDecares ? `${totalDecares} дка` : ""}
            />
          </ReviewBlock>

          <ReviewBlock title={`Продукция (${crops.filter((c) => c.name.trim()).length})`}>
            {crops.filter((c) => c.name.trim()).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Не сте добавили култури — можете да го направите и по-късно.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {crops
                  .filter((c) => c.name.trim())
                  .map((c, i) => (
                    <li key={i} className="text-sm text-foreground">
                      <span className="font-semibold">{c.name}</span>
                      {c.category ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {c.category}
                        </span>
                      ) : null}
                      {c.decares ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {c.decares} дка
                        </span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </ReviewBlock>
        </div>
      )}

      {/* Навигация */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={back} disabled={pending}>
            Назад
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            Вече имате акаунт?{" "}
            <Link href="/vhod" className="font-medium text-primary hover:underline">
              Влезте
            </Link>
          </span>
        )}

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Продължи
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Създаваме профила…" : "Завърши регистрацията"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">
        {value || "—"}
      </span>
    </div>
  );
}
