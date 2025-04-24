"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, isFuture, isToday } from "date-fns";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/store/auth";
import { SubscriptionWarningBanner } from "@/components/layout/subscription-warning-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use individual selectors to avoid unnecessary rerenders
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    // Skip calculation on initial render to avoid hydration mismatches
    if (typeof window === "undefined") return;

    // Skip if we've already processed this state
    if (isLoading || hasCalculated) return;

    const clinicIsActive = user?.clinic?.isActive ?? false;
    const subEndDateString = user?.clinic?.subscriptionEndDate;

    if (clinicIsActive && subEndDateString) {
      const endDateObj = new Date(subEndDateString);
      if (
        !isNaN(endDateObj.getTime()) &&
        (isFuture(endDateObj) || isToday(endDateObj))
      ) {
        const today = new Date();
        const diff = differenceInCalendarDays(endDateObj, today);
        setDaysRemaining(diff);
        setEndDate(endDateObj);
      } else {
        setDaysRemaining(null);
        setEndDate(null);
      }
    } else {
      setDaysRemaining(null);
      setEndDate(null);
    }

    setHasCalculated(true);
  }, [isLoading, user, hasCalculated]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar - hidden on mobile, visible on md and up */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          {isAuthenticated &&
            !isLoading &&
            daysRemaining !== null &&
            daysRemaining <= 3 &&
            endDate && (
              <SubscriptionWarningBanner
                daysRemaining={daysRemaining}
                endDate={endDate}
              />
            )}
          <main className="flex-1 overflow-y-auto bg-background/50 dark:bg-background/30 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
