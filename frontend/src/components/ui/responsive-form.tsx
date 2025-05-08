import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}

/**
 * ResponsiveForm - A component to wrap forms and ensure they're responsive and scrollable
 * Especially useful for forms in modals or on mobile devices
 */
export function ResponsiveForm({
  children,
  footer,
  className,
  contentClassName,
  footerClassName,
  ...props
}: ResponsiveFormProps) {
  return (
    <form
      {...props}
      className={cn("flex flex-col max-h-full w-full", className)}
    >
      {/* Scrollable content area */}
      <div
        className={cn(
          "flex-1 overflow-y-auto pb-4 space-y-4",
          contentClassName
        )}
      >
        {children}
      </div>

      {/* Fixed footer area if provided */}
      {footer && (
        <div
          className={cn("flex-shrink-0 border-t pt-4 mt-4", footerClassName)}
        >
          {footer}
        </div>
      )}
    </form>
  );
}
