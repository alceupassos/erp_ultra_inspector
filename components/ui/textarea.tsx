import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-primary/20 bg-black/30 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:glow-border transition-all",
        className
      )}
      {...props}
    />
  );
});
