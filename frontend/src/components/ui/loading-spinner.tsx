"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  fullScreen = false,
  text = "Loading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const spinnerClasses = cn(
    "animate-spin text-primary",
    sizeClasses[size],
    className
  );

  const spinner = (
    <>
      <Loader2 className={spinnerClasses} />
      <span className="sr-only">{text}</span>
    </>
  );

  if (fullScreen) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return <div className="inline-flex">{spinner}</div>;
}
