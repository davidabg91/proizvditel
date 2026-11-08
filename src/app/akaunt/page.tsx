import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { PageHero } from "@/components/layout/page-hero";
import { Icon } from "@/components/ui/icons";
import { ChangePasswordForm, DeleteAccountForm } from "./account-forms";

export const metadata: Metadata = {
  title: "Моят акаунт",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/vhod?next=/akaunt");

  return (
    <main>
      <PageHero
        eyebrow="Акаунт"
        title="Моят акаунт"
        description={`Влезли сте като ${user.email}.`}
        breadcrumbs={[{ label: "Моят акаунт" }]}
      />
      <div className="container-page pb-16 pt-2 sm:pt-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-8">
            <h2 className="flex items-center gap-2.5 text-xl font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon name="shield" size={18} />
              </span>
              Смяна на паролата
            </h2>
            <div className="mt-5">
              <ChangePasswordForm />
            </div>
          </section>

          <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-8">
            <h2 className="text-xl font-semibold">Изтриване на профила</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Можете да изтриете профила си по всяко време. Личните ви данни се
              премахват; пазим само поръчките без лични данни за срока, който
              изисква счетоводният закон.
            </p>
            <div className="mt-5">
              <DeleteAccountForm isProducer={!!user.producer} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
