"use client";

import { useState, useEffect, ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A wrapper component that renders children only on the client-side
 * after hydration is complete to prevent hydration mismatch errors
 */
export default function ClientOnly({
  children,
  fallback = <div className="p-4 text-center">Loading...</div>,
}: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return fallback;
  }

  return <>{children}</>;
}
