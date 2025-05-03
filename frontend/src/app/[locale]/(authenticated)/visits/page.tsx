import { Suspense } from "react";
import { VisitsClient } from "./visits-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function VisitsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VisitsClient />
    </Suspense>
  );
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
