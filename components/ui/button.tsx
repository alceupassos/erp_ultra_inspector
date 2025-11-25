import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" }
>(function Button({ className, variant = "default", ...props }, ref) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed glow-border glow-on-hover";

  const variants: Record<string, string> = {
    default: "bg-primary/20 text-primary hover:bg-primary/30 shadow-[0_8px_24px_rgba(255,138,31,0.25)]",
    outline:
      "border border-primary/30 bg-transparent hover:bg-primary/10 text-primary"
  };

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
});
