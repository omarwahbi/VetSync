import { ManageUsersClient } from "./manage-users-client";

export default function ManageUsersPage() {
  return <ManageUsersClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
