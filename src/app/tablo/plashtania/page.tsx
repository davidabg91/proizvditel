import { redirect } from "next/navigation";
import { getCurrentProducer } from "@/lib/session";
import { PaymentForm } from "./payment-form";
import { StripeConnect } from "./stripe-connect";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  const p = producer.payment;
  const { stripe: stripeParam } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Начини на плащане</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Изберете как клиентите да ви плащат. Плащането с карта минава през Stripe
          и постъпва директно във вашата сметка; наложеният платеж се заплаща при
          доставка на пратката.
        </p>
      </div>

      <div className="mb-8">
        <StripeConnect
          hasAccount={!!producer.stripeAccountId}
          chargesEnabled={producer.stripeChargesEnabled}
          justReturned={stripeParam === "return"}
        />
      </div>

      <PaymentForm
        initial={{
          acceptsBankTransfer: p?.acceptsBankTransfer ?? false,
          bankName: p?.bankName ?? "",
          bankIban: p?.bankIban ?? "",
          bankHolder: p?.bankHolder ?? "",
          acceptsRevolut: p?.acceptsRevolut ?? false,
          revolutLink: p?.revolutLink ?? "",
          acceptsCod: p?.acceptsCod ?? false,
          codNote: p?.codNote ?? "",
        }}
      />
    </div>
  );
}
