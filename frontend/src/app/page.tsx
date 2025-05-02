export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

// Server component that redirects to the dashboard
export default function RootPage() {
  redirect("/dashboard");
}
