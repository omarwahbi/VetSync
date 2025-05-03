"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; message: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console
    console.error("Global error caught:", error);
  }, [error]);

  // Check if this is a NextIntl context error
  const isNextIntlError =
    error.message.includes("NextIntlClientProvider") ||
    error.message.includes("useTranslations");

  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Something went wrong!</h1>

      {isNextIntlError && (
        <div className="mb-6 p-4 bg-orange-100 text-orange-800 rounded-md max-w-2xl text-left">
          <h2 className="font-semibold mb-2">Translation Context Error</h2>
          <p className="mb-2">
            The app couldn&apos;t find the translation context. This typically
            happens when:
          </p>
          <ul className="list-disc list-inside mb-2">
            <li>
              A server component is trying to use client-only translation hooks
            </li>
            <li>The NextIntlClientProvider wasn&apos;t properly initialized</li>
            <li>There was a hydration mismatch during page loading</li>
          </ul>
          <p>
            Try refreshing the page. If the problem persists, try clearing your
            browser cache or using a different browser.
          </p>
        </div>
      )}

      <div className="my-4 text-sm text-gray-600 max-w-xl">
        <p>Error: {error.message}</p>
        {error.digest && <p>Digest: {error.digest}</p>}
      </div>

      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
