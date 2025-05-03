import { OwnersClient } from "./owners-client";

export default function OwnersPage() {
  return <OwnersClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
