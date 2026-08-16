import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  htmlFor,
  hint,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground", className)}
    >
      <span>{children}</span>
      {hint ? (
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  description,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <Label htmlFor={htmlFor} hint={hint}>
          {label}
        </Label>
      ) : null}
      {children}
      {description && !error ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
