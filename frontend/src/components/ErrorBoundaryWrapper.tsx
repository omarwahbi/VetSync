"use client";

import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Remove the useI18n hook to ensure this component can render in any context
  // const t = useI18n();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center p-8 bg-white shadow-md rounded-lg max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          Something went wrong
        </h2>
        <p className="mb-4 text-gray-600 text-sm overflow-auto max-h-32">
          {error?.message || "An unexpected error occurred"}
        </p>
        <Button onClick={resetErrorBoundary} variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}

export function ErrorBoundaryWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleReset = () => {
    // Optional: add any reset logic here if needed
    window.location.reload();
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
      onError={(error) => {
        // Log the error to console
        console.error("Error caught by error boundary:", error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
