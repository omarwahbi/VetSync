"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayoutLegacy({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new locale-based URL
    // Default to 'en' if no locale is detected
    router.replace("/en/admin");
  }, [router]);

  // We render children here to avoid the unused parameter warning
  return (
    <div className="p-8 text-center">
      <p>Redirecting to new URL...</p>
      <div style={{ display: "none" }}>{children}</div>
    </div>
  );
}
