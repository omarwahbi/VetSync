"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

interface SubscriptionWarningBannerProps {
  daysRemaining: number;
  endDate: Date;
}

export function SubscriptionWarningBanner({
  daysRemaining,
  endDate,
}: SubscriptionWarningBannerProps) {
  return (
    <div className="bg-red-500 text-white py-2 px-4 text-center text-sm">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>
            {daysRemaining === 0
              ? "Your subscription expires today!"
              : `Your subscription expires in ${daysRemaining} days.`}
          </span>
          <span className="hidden sm:inline">
            ({format(endDate, "dd MMM yyyy")})
          </span>
          <span className="font-semibold ml-2">
            Action required to maintain service.
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white text-red-500 hover:bg-red-50 whitespace-nowrap"
        >
          Renew Now
        </Button>
      </div>
    </div>
  );
}
