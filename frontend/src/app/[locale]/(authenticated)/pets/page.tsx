import { PetsClient } from "./pets-client";

export default function PetsPage() {
  return <PetsClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
