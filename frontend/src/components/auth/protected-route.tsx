"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Use individual selectors to avoid unnecessary rerenders
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const accessToken = useAuthStore((state) => state.accessToken);

  const router = useRouter();

  useEffect(() => {
    // Only run redirection logic after state has been rehydrated
    if (!isLoading) {
      if (!isAuthenticated && !accessToken) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, accessToken, router]);

  // Show loading state while authentication is being determined
  if (isLoading) {
    return <LoadingSpinner fullScreen size="md" />;
  }

  // Only render children when authenticated
  if (!isLoading && isAuthenticated) {
    return <>{children}</>;
  }

  // Return null for non-authenticated states - the useEffect will handle redirection
  return null;
}
