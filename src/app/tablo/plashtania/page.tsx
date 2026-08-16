import { redirect } from "next/navigation";
import { getCurrentProducer } from "@/lib/session";
import { PaymentForm } from "./payment-form";

export default async function PaymentPage() {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  const p = producer.payment;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Начини на плащане</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Изберете как клиентите да ви плащат. Плащанията се извършват директно
          между вас и клиента — платформата не обработва пари.
        </p>
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
