"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

// This component acts as a proof that NextIntlClientProvider context is working
export function ClientInit() {
  // Try to use translation hook to ensure the context is properly initialized
  try {
    // Just accessing the hook is enough to ensure it's set up
    useTranslations("Common");
  } catch (error) {
    // If there's an error, log it but don't crash
    console.error("Translation context initialization failed:", error);
  }

  useEffect(() => {
    // Log confirmation that client-side initialized
    console.log("Client-side initialization complete");
  }, []);

  // This component doesn't render anything visible
  return null;
}
