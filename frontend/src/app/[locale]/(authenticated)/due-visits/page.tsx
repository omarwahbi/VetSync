import { DueVisitsClient } from "./due-visits-client";

export default function DueVisitsPage() {
  return <DueVisitsClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
