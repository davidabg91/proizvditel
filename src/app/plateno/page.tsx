import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SuccessView, type PaymentState } from "./success-view";

export const metadata: Metadata = {
  title: "Поръчка",
  robots: { index: false },
};

/**
 * Страницата след поръчка. Преди показваше „Плащането е успешно“ на всеки,
 * който отвори адреса; сега първо проверява при Stripe (карта) или в базата
 * (наложен платеж), че поръчката наистина съществува.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string;
    producer?: string;
    cod?: string;
    order_id?: string;
  }>;
}) {
  const sp = await searchParams;
  let state: PaymentState = "unknown";

  if (sp.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sp.session_id);
      state = session.payment_status === "paid" ? "paid" : "unpaid";
    } catch {
      state = "unknown";
    }
  } else if (sp.cod === "1" && sp.order_id) {
    const order = await prisma.order.findUnique({
      where: { id: sp.order_id },
      select: { paymentMethod: true },
    });
    state = order?.paymentMethod === "cod" ? "cod" : "unknown";
  }

  return (
    <main className="container-page py-20">
      <SuccessView
        state={state}
        producer={sp.producer ?? null}
        orderId={state === "cod" ? (sp.order_id ?? null) : null}
      />
    </main>
  );
}
