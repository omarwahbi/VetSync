import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SubscriptionProvider } from "@/components/layout/subscription-provider";
import { Locale } from "@/i18n";
import { getMessages, setRequestLocale } from "next-intl/server";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  // Wait for params to be available and extract locale
  const { locale } = await Promise.resolve(params);

  // Set locale for server component
  setRequestLocale(locale);

  // Pre-fetch messages at the layout level to ensure proper context
  await getMessages({ locale });

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar - hidden on mobile, visible on md and up */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <div id="subscription-warning-container"></div>
          <SubscriptionProvider />
          <main className="flex-1 overflow-y-auto bg-background/50 dark:bg-background/30 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
