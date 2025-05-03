import { redirect } from "next/navigation";

export default async function Home({ params }: { params: { locale: string } }) {
  // Redirect to the authenticated dashboard route for the current locale
  redirect(`/${params.locale}/dashboard`);
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
