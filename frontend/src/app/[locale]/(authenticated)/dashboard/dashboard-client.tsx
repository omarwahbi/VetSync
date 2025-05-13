/**
 * This file contains the client-side components for the dashboard.
 * It is dynamically imported and rendered client-side only.
 * This ensures the NextIntlClientProvider context is properly established.
 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { Users, PawPrint, CalendarCheck2, Plus } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NewClientWizard } from "@/components/wizards/new-client-wizard";
import { QuickAddVisitModal } from "@/components/forms/quick-add-visit-modal";
import { cn } from "@/lib/utils";

// Use a more direct translation approach for the client component
import { useTranslations } from "next-intl";

// Interface for upcoming visits
interface UpcomingVisit {
  id: string;
  petId: string;
  pet: {
    name: string;
    owner: {
      firstName: string;
      lastName: string;
    };
  };
  nextReminderDate: string;
  visitType: string;
}

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

// Function to fetch dashboard stats
const fetchDashboardStats = async () => {
  const response = await axiosInstance.get("/dashboard/stats");
  return response.data as {
    ownerCount: number;
    petCount: number;
    upcomingVaccinationCount: number;
    dueTodayCount: number;
    isAdminView: boolean;
  };
};

// Function to fetch upcoming visits
const fetchUpcomingVisits = async (): Promise<UpcomingVisit[]> => {
  const response = await axiosInstance.get("/visits/upcoming");
  return response.data;
};

// Function to get appropriate badge color for visit type
const getVisitTypeBadgeColor = (visitType: string) => {
  switch (visitType.toLowerCase()) {
    case "checkup":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "vaccination":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "emergency":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "surgery":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "dental":
      return "bg-cyan-100 text-cyan-800 hover:bg-cyan-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

// Function to translate visit types
const getTranslatedVisitType = (
  visitType: string,
  t: ReturnType<typeof useTranslations>
) => {
  switch (visitType.toLowerCase()) {
    case "checkup":
      return t("visitTypeCheckup");
    case "vaccination":
      return t("visitTypeVaccination");
    case "emergency":
      return t("visitTypeEmergency");
    case "surgery":
      return t("visitTypeSurgery");
    case "dental":
      return t("visitTypeDental");
    case "grooming":
      return t("visitTypeGrooming");
    default:
      return t("visitTypeOther");
  }
};

// Localized date formatter
const formatLocalizedDate = (dateString: string, locale: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    // For Arabic locale
    if (locale === "ar") {
      return new Intl.DateTimeFormat("ar-EG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    }

    // For English and other locales, ensure day-month-year format
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    // Fallback direct implementation
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }
};

// Main dashboard component
export function DashboardClient() {
  console.log("DashboardClient: Initializing");

  // Get current locale from params to confirm it's correct
  const params = useParams();

  // Access translations directly
  const t = useTranslations("Dashboard");

  const { user } = useAuthStore();
  const userRole = user?.role;
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const locale = params.locale as string;

  // Query for fetching dashboard stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
  });

  // Query for fetching upcoming visits
  const {
    data: upcomingVisits = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["upcomingVisits"],
    queryFn: fetchUpcomingVisits,
  });

  // Prepare display values for stats
  const ownerCountDisplay = isLoadingStats ? (
    <LoadingSpinner size="sm" text={t("totalOwners")} />
  ) : (
    stats?.ownerCount ?? 0
  );

  const petCountDisplay = isLoadingStats ? (
    <LoadingSpinner size="sm" text={t("totalPets")} />
  ) : (
    stats?.petCount ?? 0
  );

  const dueTodayCountDisplay = isLoadingStats ? (
    <Skeleton className="h-8 w-16" />
  ) : (
    stats?.dueTodayCount ?? 0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {user
              ? t("welcomeBack", { name: user.firstName || t("user") })
              : t("welcome")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 whitespace-nowrap"
            onClick={() => setIsVisitModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("newVisit")}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1 whitespace-nowrap"
            onClick={() => setIsWizardOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("registerClient")}
          </Button>
        </div>
      </div>

      {/* Only show stats cards for ADMIN and CLINIC_ADMIN users */}
      {userRole !== "STAFF" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Visits Due Today Card */}
          <Link
            href={`/${locale}/due-visits`}
            className="transition-transform hover:scale-105"
          >
            <Card className="bg-white dark:bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("visitsDueToday")}
                </CardTitle>
                <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dueTodayCountDisplay}</div>
                {isErrorStats && (
                  <p className="text-xs text-red-500">
                    {t("errorLoadingStats")}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Owner Count Card */}
          <Link
            href={`/${locale}/owners`}
            className="transition-transform hover:scale-105"
          >
            <Card className="bg-white dark:bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("totalOwners")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ownerCountDisplay}</div>
                {isErrorStats && (
                  <p className="text-xs text-red-500">
                    {t("errorLoadingStats")}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Pet Count Card */}
          <Link
            href={`/${locale}/pets`}
            className="transition-transform hover:scale-105"
          >
            <Card className="bg-white dark:bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("totalPets")}
                </CardTitle>
                <PawPrint className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{petCountDisplay}</div>
                {isErrorStats && (
                  <p className="text-xs text-red-500">
                    {t("errorLoadingStats")}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Upcoming Visits Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("upcomingVisits")}</h2>
        <Card>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner text={t("loadingVisits")} />
            </div>
          ) : isError ? (
            <div className="text-center p-8 text-red-500">
              <p>{t("errorLoadingVisits")}</p>
            </div>
          ) : upcomingVisits.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>{t("noUpcomingVisits")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("petName")}</TableHead>
                  <TableHead>{t("ownerName")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("visitType")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      <div className="font-medium">{visit.pet.name}</div>
                    </TableCell>
                    <TableCell>
                      {visit.pet.owner.firstName} {visit.pet.owner.lastName}
                    </TableCell>
                    <TableCell>
                      {formatLocalizedDate(visit.nextReminderDate, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-full px-2 py-1 text-xs",
                          getVisitTypeBadgeColor(visit.visitType)
                        )}
                        variant="outline"
                      >
                        {getTranslatedVisitType(visit.visitType, t)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Modals - Now pass locale instead of messages */}
      {isWizardOpen && (
        <NewClientWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
        />
      )}

      {isVisitModalOpen && (
        <QuickAddVisitModal
          isOpen={isVisitModalOpen}
          onClose={() => setIsVisitModalOpen(false)}
        />
      )}
    </div>
  );
}
