import { Suspense, use } from "react";
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

// Define resolved params type
interface ResolvedPageParams {
  locale: string;
}

// Define the props with Promise-based params
interface PageProps {
  params: Promise<ResolvedPageParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Function to fetch messages
async function fetchMessages(locale: string) {
  setRequestLocale(locale);
  return getMessages();
}

export default function DashboardPage(props: PageProps) {
  // Unwrap the promises using React.use()
  const params = use(props.params);

  // Get the locale from params
  const { locale } = params;

  // Debug the locale being used
  console.log("DashboardPage: Using locale:", locale);

  // Get messages to pass to the client component
  const messagesPromise = fetchMessages(locale);
  const messages = use(messagesPromise);

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
