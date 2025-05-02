"use client";

import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Users,
  PawPrint,
  CalendarCheck2,
  Plus,
} from "lucide-react";
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
import { cn, formatDisplayDate } from "@/lib/utils";
import Link from "next/link";

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const userRole = user?.role;
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

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
    <LoadingSpinner size="sm" text="Total Owners" />
  ) : (
    stats?.ownerCount ?? 0
  );

  const petCountDisplay = isLoadingStats ? (
    <LoadingSpinner size="sm" text="Total Pets" />
  ) : (
    stats?.petCount ?? 0
  );

  const upcomingVaccinationCountDisplay = isLoadingStats ? (
    <LoadingSpinner size="sm" text="Upcoming Vaccinations" />
  ) : (
    stats?.upcomingVaccinationCount ?? 0
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
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            {user
              ? `Welcome back, ${user.firstName || "User"}!`
              : "Welcome to VetSync"}
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
            New Visit
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1 whitespace-nowrap"
            onClick={() => setIsWizardOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Register Client
          </Button>
        </div>
      </div>

      {/* Only show stats cards for ADMIN and CLINIC_ADMIN users */}
      {userRole !== "STAFF" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Visits Due Today Card */}
          <Link
            href="/due-visits"
            className="transition-transform hover:scale-105"
          >
            <Card className="bg-white dark:bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Visits Due Today
                </CardTitle>
                <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dueTodayCountDisplay}</div>
                {isErrorStats && (
                  <p className="text-xs text-red-500">Error loading stats</p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Owner Count Card */}
          <Link href="/owners" className="transition-transform hover:scale-105">
            <Card className="bg-white dark:bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Owners
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ownerCountDisplay}</div>
                {isErrorStats && (
                  <p className="text-xs text-red-500">Error loading stats</p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Pet Count Card */}
          <Link href="/pets" className="transition-transform hover:scale-105">
            <Card className="bg-white dark:bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pets
                </CardTitle>
                <PawPrint className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{petCountDisplay}</div>
                {isErrorStats && (
                  <p className="text-xs text-red-500">Error loading stats</p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Upcoming Vaccinations Card */}
          <Link
            href="/visits?page=1&visitType=vaccination"
            className="transition-transform hover:scale-105"
          >
            <Card className="bg-white dark:bg-card shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Vaccinations
                </CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {upcomingVaccinationCountDisplay}
                </div>
                {isErrorStats && (
                  <p className="text-xs text-red-500">Error loading stats</p>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Upcoming Visits Section */}
      <div className="grid gap-4">
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Visits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <LoadingSpinner size="md" text="Loading upcoming visits..." />
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-red-500">
                Error loading visits
              </div>
            ) : upcomingVisits.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No upcoming visits scheduled
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pet</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <Link
                          href={`/pets/${visit.petId}`}
                          className="text-primary hover:underline"
                        >
                          {visit.pet.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {`${visit.pet.owner.firstName} ${visit.pet.owner.lastName}`}
                      </TableCell>
                      <TableCell>
                        {formatDisplayDate(visit.nextReminderDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-normal text-xs",
                            getVisitTypeBadgeColor(visit.visitType)
                          )}
                        >
                          {visit.visitType}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Client Wizard Modal */}
      {isWizardOpen && (
        <NewClientWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
        />
      )}

      {/* Quick Add Visit Modal */}
      {isVisitModalOpen && (
        <QuickAddVisitModal
          isOpen={isVisitModalOpen}
          onClose={() => setIsVisitModalOpen(false)}
        />
      )}
    </div>
  );
}
