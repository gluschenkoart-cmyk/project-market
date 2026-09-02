import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-heading font-bold " +
  "transition-transform duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

const variants: Record<ButtonVariant, string> = {
  // Основна дія — суцільний акцент, товстий контур, "стікерна" тінь-зсув.
  primary:
    "bg-accent text-paper border-[3px] border-ink shadow-[4px_4px_0_0_var(--color-ink)] hover:brightness-105",
  // Другорядна дія — той самий контур, але без заливки.
  secondary:
    "bg-paper text-ink border-[3px] border-ink shadow-[4px_4px_0_0_var(--color-ink)] hover:bg-ink/5",
  // Найтихіша дія — без рамки й тіні, лише текст.
  ghost: "text-ink underline decoration-2 underline-offset-4 hover:text-accent active:translate-x-0 active:translate-y-0",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-base",
  sm: "px-3.5 py-1.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
