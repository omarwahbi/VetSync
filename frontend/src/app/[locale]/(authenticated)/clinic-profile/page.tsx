import { ClinicProfileClient } from "./clinic-profile-client";

export default function ClinicProfilePage() {
  return <ClinicProfileClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
