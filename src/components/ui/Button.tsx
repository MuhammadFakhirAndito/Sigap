import React from "react";

export type ButtonVariant = "cta" | "outline" | "icon" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "cta", children, icon, className = "", ...props }, ref) => {
    let baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    let variantStyles = "";

    switch (variant) {
      case "cta":
        variantStyles =
          "bg-[var(--color-cta)] text-[var(--color-on-cta)] rounded-full px-6 sm:px-8 py-3.5 min-h-[48px] text-base hover:opacity-90 active:scale-[0.98]";
        break;
      case "outline":
        variantStyles =
          "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-full px-5 py-2.5 min-h-[44px] text-sm hover:bg-[var(--color-surface-raised)] active:scale-[0.98]";
        break;
      case "icon":
        variantStyles =
          "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-full w-11 h-11 min-w-[44px] min-h-[44px] p-0 hover:bg-[var(--color-surface)] active:scale-95";
        break;
      case "ghost":
        variantStyles =
          "bg-transparent text-[var(--color-text-primary)] rounded-full px-4 py-2 min-h-[44px] text-sm hover:bg-[var(--color-surface)]";
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
        {icon && <span className={children ? "ml-2" : ""}>{icon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
