import { ArticlePage } from "@/components/layout/article-page";
import { COMPANY, AUTHORITIES } from "@/lib/company";

export const metadata = { title: "Контакти" };

export default function ContactsPage() {
  return (
    <ArticlePage eyebrow="Контакти" title="Свържете се с нас">
      <p>
        Имате въпрос, предложение или се нуждаете от помощ? Ще се радваме да ви чуем.
        Отговаряме в рамките на един работен ден.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-border bg-surface px-5 py-4">
          <p className="text-sm text-muted-foreground">Имейл</p>
          <p className="font-medium break-words">{COMPANY.email}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border bg-surface px-5 py-4">
          <p className="text-sm text-muted-foreground">Телефон</p>
          <p className="font-medium">{COMPANY.phone}</p>
        </div>
      </div>

      <h2>Данни на дружеството</h2>
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted/60 px-5 py-4 text-sm">
        <dl className="flex flex-col gap-2">
          <div>
            <dt className="text-muted-foreground">Наименование</dt>
            <dd className="font-medium">
              {COMPANY.name} ({COMPANY.nameLatin})
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ЕИК</dt>
            <dd className="font-medium">{COMPANY.eik}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Правна форма</dt>
            <dd className="font-medium">{COMPANY.legalForm}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Седалище и адрес на управление</dt>
            <dd className="font-medium">{COMPANY.addressLines.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Управител</dt>
            <dd className="font-medium">{COMPANY.manager}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Регистрация по ЗДДС</dt>
            <dd className="font-medium">Не</dd>
          </div>
        </dl>
      </div>

      <h2>Жалби и надзорни органи</h2>
      <p>
        Ако имате оплакване, първо ни пишете — в повечето случаи въпросът се решава
        бързо. Ако не постигнем съгласие, можете да се обърнете към:
      </p>
      <ul>
        <li>
          <strong>{AUTHORITIES.kzp.name}</strong> — {AUTHORITIES.kzp.address}, тел.{" "}
          {AUTHORITIES.kzp.phone}, {AUTHORITIES.kzp.site}
        </li>
        <li>
          <strong>{AUTHORITIES.kzld.name}</strong> — за въпроси относно личните данни:{" "}
          {AUTHORITIES.kzld.address}, тел. {AUTHORITIES.kzld.phone},{" "}
          {AUTHORITIES.kzld.site}
        </li>
      </ul>
      <p>
        Правата ви при покупка са описани на страницата{" "}
        <a href="/otkaz-ot-dogovor">Отказ и рекламации</a>.
      </p>
    </ArticlePage>
  );
}
