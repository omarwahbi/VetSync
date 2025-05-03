"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersLegacyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new locale-based URL
    // Default to 'en' if no locale is detected
    router.replace("/en/admin/users");
  }, [router]);

  return (
    <div className="p-8 text-center">
      <p>Redirecting to new URL...</p>
    </div>
  );
}
