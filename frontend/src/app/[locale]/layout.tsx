import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Inter } from "next/font/google";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import "../globals.css";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { ClientInit } from "@/components/layout/client-init";
import { locales, Locale } from "@/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

interface ResolvedPageParams {
  locale: string;
}

type Props = {
  children: React.ReactNode;
  params: Promise<ResolvedPageParams>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<ResolvedPageParams>;
}): Promise<Metadata> {
  // Get the locale from params
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  const isRtl = locale === "ar";

  return {
    title: {
      template: "%s | VetSync",
      default: "VetSync",
    },
    description: "Modern pet care management system for veterinary clinics",
    icons: {
      icon: [
        { url: "/favicon.png", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
      other: [
        {
          rel: "mask-icon",
          url: "/safari-pinned-tab.svg",
          color: "#3B82F6",
        },
      ],
    },
    manifest: "/site.webmanifest",
    // Set language in metadata
    other: {
      // These will be passed as attributes to the html element
      lang: locale,
      dir: isRtl ? "rtl" : "ltr",
    },
  };
}

// Function to load messages
async function loadMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    notFound();
  }
}

export default function LocaleLayout({ children, params }: Props) {
  // Unwrap the promise with use()
  const resolvedParams = use(params);
  const { locale } = resolvedParams;

  // Enable static rendering with the locale
  setRequestLocale(locale);

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Load messages for this locale
  const messagesPromise = loadMessages(locale);
  const messages = use(messagesPromise);

  // Determine direction for wrapper
  const isRtl = locale === "ar";

  // Choose font based on locale
  const fontClass = isRtl
    ? `${ibmPlexSansArabic.variable} font-arabic`
    : `${inter.variable} font-sans`;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`${isRtl ? "rtl" : "ltr"} ${fontClass}`}
      >
        <ClientInit />
        <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
      </div>
    </NextIntlClientProvider>
  );
}
