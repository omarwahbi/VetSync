import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n";

// Server component that redirects to the localized dashboard
export default function RootPage() {
  redirect(`/${defaultLocale}/dashboard`);
}
