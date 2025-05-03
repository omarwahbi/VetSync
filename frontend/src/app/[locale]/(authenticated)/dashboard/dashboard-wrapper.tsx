"use client";

import { useState, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import { DashboardClient } from "./dashboard-client";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

// Define the messages type for TypeScript
type Messages = Record<string, Record<string, string> | string>;

// Dashboard wrapper to properly handle translations on the client
export default function DashboardWrapper({
  messages,
  locale,
}: {
  messages: Messages;
  locale: string;
}) {
  const [hydrated, setHydrated] = useState(false);

  // Debug what messages we're getting
  useEffect(() => {
    console.log("Dashboard wrapper for locale:", locale);
    console.log("Messages structure:", Object.keys(messages));

    if (messages.Dashboard && typeof messages.Dashboard === "object") {
      console.log("Dashboard keys:", Object.keys(messages.Dashboard));
      console.log("Title translation:", messages.Dashboard.title);
    } else {
      console.warn("No Dashboard translations found!");
    }
  }, [messages, locale]);

  // Wait for hydration to complete
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // Return a minimal loading state while waiting for hydration
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  // Directly select the right message file based on locale to ensure we have all translations
  const directMessages = locale === "ar" ? arMessages : enMessages;

  console.log(
    "Using direct messages for locale:",
    locale,
    "Dashboard title:",
    directMessages.Dashboard?.title
  );

  return (
    <NextIntlClientProvider locale={locale} messages={directMessages}>
      <DashboardClient />
    </NextIntlClientProvider>
  );
}
