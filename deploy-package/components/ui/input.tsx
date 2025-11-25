import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, style, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-xl border border-primary/20 bg-black/30 px-3 text-sm text-primary placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:glow-border transition-all",
        "caret-primary selection:bg-primary/20 selection:text-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{
        color: '#ff8a1f',
        caretColor: '#ff8a1f',
        WebkitTextFillColor: '#ff8a1f',
        zIndex: 1,
        position: 'relative',
        ...style
      }}
      {...props}
    />
  );
});
