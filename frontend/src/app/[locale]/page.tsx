import { redirect } from "next/navigation";
import { use } from "react";

interface ResolvedPageParams {
  locale: string;
}

export default function Home({
  params,
}: {
  params: Promise<ResolvedPageParams>;
}) {
  // Unwrap the params promise
  const resolvedParams = use(params);
  const { locale } = resolvedParams;

  // Redirect to the authenticated dashboard route for the current locale
  redirect(`/${locale}/dashboard`);
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
