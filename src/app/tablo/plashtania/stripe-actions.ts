"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getSiteUrl } from "@/lib/stripe";

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
