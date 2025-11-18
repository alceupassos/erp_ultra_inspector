import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" }
>(function Button({ className, variant = "default", ...props }, ref) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed glow-border";

  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:bg-[#ff8a1f] shadow-[0_8px_24px_rgba(255,122,0,0.35)]",
    outline:
      "border border-muted-foreground/40 bg-transparent hover:bg-muted/40 text-foreground"
  };

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
});
