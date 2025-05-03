import { PetDetailsClient } from "./pet-details-client";

export default function PetDetailsPage() {
  return <PetDetailsClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
