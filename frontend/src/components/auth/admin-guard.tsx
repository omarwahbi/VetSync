"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  // Use individual selectors to avoid unnecessary rerenders
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  const router = useRouter();

  useEffect(() => {
    // Only run redirection logic after state has been rehydrated
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== "ADMIN") {
        // Redirect to dashboard if authenticated but not admin
        // Otherwise redirect to login
        const redirectPath = isAuthenticated ? "/dashboard" : "/login";
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading state while authentication is being determined
  if (isLoading) {
    return <LoadingSpinner fullScreen size="md" />;
  }

  // Only render children when authenticated and user is an admin
  if (!isLoading && isAuthenticated && user?.role === "ADMIN") {
    return <>{children}</>;
  }

  // Return null for non-authenticated states - the useEffect will handle redirection
  return null;
}
