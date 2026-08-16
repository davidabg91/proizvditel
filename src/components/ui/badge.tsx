import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "accent" | "success" | "danger" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  outline: "border border-border-strong text-muted-foreground",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
