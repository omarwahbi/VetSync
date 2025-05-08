import React from "react";
import { cn } from "@/lib/utils";

interface FormContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}

/**
 * FormContainer - A responsive container for form content with optional footer
 * Ensures content is properly scrollable on all screen sizes
 */
export function FormContainer({
  children,
  footer,
  className,
  contentClassName,
  footerClassName,
  ...props
}: FormContainerProps) {
  return (
    <div
      className={cn("flex flex-col h-full max-h-full w-full", className)}
      {...props}
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
          className={cn("pt-4 mt-2 border-t flex-shrink-0", footerClassName)}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
