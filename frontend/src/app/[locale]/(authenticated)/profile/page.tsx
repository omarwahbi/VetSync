import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  return <ProfileClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
