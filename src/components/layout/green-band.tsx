import { FieldBackdrop } from "@/components/brand/field-backdrop";
import { WheatEdge } from "@/components/brand/wheat-edge";
import { cn } from "@/lib/utils";

/**
 * Зелен панел между светлите секции — продължение на началния екран.
 * Горе го отделя житната линия, долу същите ниви като в hero-то, така че
 * страницата се редува: зелено → светло → зелено, с жито по границите.
 */
export function GreenBand({
  id,
  children,
  className,
  contentClassName,
}: {
  /** Уникално в страницата — за имената на SVG градиентите. */
  id: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden text-white", className)}>
      <FieldBackdrop id={id} fieldsClassName="h-[clamp(3.5rem,8vw,6rem)]" />
      <WheatEdge id={id} />
      <div
        className={cn(
          "container-page relative z-10 pb-[clamp(5.5rem,11vw,8.5rem)] pt-[clamp(5.5rem,9vw,7.5rem)]",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
