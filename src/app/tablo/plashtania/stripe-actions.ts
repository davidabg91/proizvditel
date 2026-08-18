"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getSiteUrl } from "@/lib/stripe";

/**
 * Записаният акаунт е негоден за текущия ключ. Stripe връща различни грешки
 * за двата случая: 404 „No such account" когато акаунтът липсва, и 403
 * „does not have access to account" когато е създаден в другия режим
 * (тестов ↔ жив). Ловим и двете, но не и мрежови грешки, за да не изтрием
 * валиден акаунт при временен проблем.
 */
function isUnusableAccount(e: unknown): boolean {
  const err = e as { code?: string; statusCode?: number; message?: string };
  if (err?.code === "resource_missing" || err?.code === "account_invalid")
    return true;
  if (err?.statusCode === 403 || err?.statusCode === 404) return true;
  const msg = err?.message ?? "";
  return (
    msg.includes("does not have access to account") ||
    msg.includes("No such account")
  );
}

export type StripeActionResult =
  | { ok: true; url?: string }
  | { ok: false; error: string };

async function currentProducer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      slug: true,
      farmName: true,
      contactEmail: true,
      stripeAccountId: true,
    },
  });
}

/** Създава (при нужда) Express акаунт и връща линк за onboarding. */
export async function startStripeOnboarding(): Promise<StripeActionResult> {
  const producer = await currentProducer();
  if (!producer) return { ok: false, error: "Изисква се вход." };
  if (!process.env.STRIPE_SECRET_KEY)
    return { ok: false, error: "Stripe не е конфигуриран." };

  const site = getSiteUrl();

  try {
    let accountId = producer.stripeAccountId;

    // При смяна на режима (тестов → жив) старият акаунт е невалиден —
    // забравяме го, за да се създаде нов вместо да гърми при account link.
    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
      } catch (e) {
        if (!isUnusableAccount(e)) throw e;
        accountId = null;
        await prisma.producer.update({
          where: { id: producer.id },
          data: { stripeAccountId: null, stripeChargesEnabled: false },
        });
      }
    }

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BG",
        email: producer.contactEmail ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: producer.farmName,
          url: `${site}/p/${producer.slug}`,
        },
        metadata: { producerId: producer.id },
      });
      accountId = account.id;
      await prisma.producer.update({
        where: { id: producer.id },
        data: { stripeAccountId: accountId },
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${site}/tablo/plashtania?stripe=refresh`,
      return_url: `${site}/tablo/plashtania?stripe=return`,
      type: "account_onboarding",
    });

    return { ok: true, url: link.url };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Грешка при връзка със Stripe.",
    };
  }
}

/** Опреснява статуса (charges_enabled) от Stripe. */
export async function refreshStripeStatus(): Promise<StripeActionResult> {
  const producer = await currentProducer();
  if (!producer?.stripeAccountId)
    return { ok: false, error: "Няма свързан Stripe акаунт." };

  try {
    const acct = await stripe.accounts.retrieve(producer.stripeAccountId);
    await prisma.producer.update({
      where: { id: producer.id },
      data: { stripeChargesEnabled: acct.charges_enabled ?? false },
    });
    revalidatePath("/tablo/plashtania");
    revalidatePath(`/p/${producer.slug}`);
    return { ok: true };
  } catch (e) {
    if (isUnusableAccount(e)) {
      await prisma.producer.update({
        where: { id: producer.id },
        data: { stripeAccountId: null, stripeChargesEnabled: false },
      });
      revalidatePath("/tablo/plashtania");
      return {
        ok: false,
        error:
          "Предишната връзка със Stripe вече не е валидна (създадена е в друг режим). Свържете Stripe наново.",
      };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Грешка при връзка със Stripe.",
    };
  }
}

/** Линк към Express таблото на Stripe (за вече свързани акаунти). */
export async function getStripeDashboardLink(): Promise<StripeActionResult> {
  const producer = await currentProducer();
  if (!producer?.stripeAccountId)
    return { ok: false, error: "Няма свързан Stripe акаунт." };
  try {
    const link = await stripe.accounts.createLoginLink(producer.stripeAccountId);
    return { ok: true, url: link.url };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Грешка при връзка със Stripe.",
    };
  }
}
