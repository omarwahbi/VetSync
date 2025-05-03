import { Suspense } from "react";
import { getMessages, setRequestLocale } from "next-intl/server";
import DashboardWrapper from "./dashboard-wrapper";

// Loading component
function DashboardSkeleton() {
  return (
    <div className="p-8 text-center">
      <div className="mb-4 h-8 w-48 bg-muted animate-pulse rounded mx-auto"></div>
      <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto"></div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  // Wait for params to be available
  const { locale } = await Promise.resolve(params);

  // Debug the locale being used
  console.log("DashboardPage: Using locale:", locale);

  // Set locale for server component
  setRequestLocale(locale);

  // Get messages to pass to the client component
  const messages = await getMessages();

  // Debug the loaded messages
  console.log(
    "DashboardPage: Messages loaded for Dashboard:",
    messages.Dashboard
      ? `${Object.keys(messages.Dashboard).length} keys including '${
          messages.Dashboard.title
        }'`
      : "No Dashboard translations found"
  );

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardWrapper messages={messages} locale={locale} />
    </Suspense>
  );
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
