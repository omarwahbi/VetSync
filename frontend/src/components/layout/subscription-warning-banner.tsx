"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

interface SubscriptionWarningBannerProps {
  daysRemaining: number;
  endDate: Date;
}

export function SubscriptionWarningBanner({
  daysRemaining,
  endDate,
}: SubscriptionWarningBannerProps) {
  const formattedEndDate = format(endDate, "MMMM d, yyyy"); // Example: January 15, 2024
  let title = "Subscription Alert";
  let message = "";

  if (daysRemaining <= 0) {
    title = "Subscription Expired/Expiring Today!";
    message = `Your clinic's subscription ends or ended today (${formattedEndDate}). Please contact support to renew.`;
  } else if (daysRemaining === 1) {
    title = "Subscription Expires Tomorrow!";
    message = `Your clinic's subscription expires tomorrow, ${formattedEndDate}.`;
  } else {
    title = `Subscription Expiring Soon!`;
    message = `Your clinic's subscription expires in ${daysRemaining} days on ${formattedEndDate}.`;
  }

  return (
    <Alert
      variant="destructive"
      className="rounded-none border-l-0 border-r-0 border-t-0 mb-0"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
