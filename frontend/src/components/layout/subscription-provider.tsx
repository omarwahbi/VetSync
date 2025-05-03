"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, isFuture, isToday } from "date-fns";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/store/auth";
import { SubscriptionWarningBanner } from "./subscription-warning-banner";

export function SubscriptionProvider() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  if (!isMounted) return null;

  const shouldShowBanner =
    isAuthenticated &&
    !isLoading &&
    daysRemaining !== null &&
    daysRemaining <= 3 &&
    endDate;

  // Find the container element
  const container = document.getElementById("subscription-warning-container");

  if (!container || !shouldShowBanner) return null;

  // Use portal to render the banner in the container
  return createPortal(
    <SubscriptionWarningBanner
      daysRemaining={daysRemaining!}
      endDate={endDate!}
    />,
    container
  );
}
