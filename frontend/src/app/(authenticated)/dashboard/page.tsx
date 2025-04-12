"use client";

import { useAuthStore } from "@/store/auth";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { CalendarClock } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

  // Query for fetching upcoming visits
  const {
    data: upcomingVisits = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["upcomingVisits"],
    queryFn: fetchUpcomingVisits,
  });

  // Count today's visits
  const todayVisitsCount = upcomingVisits.filter(
    (visit) =>
      visit.nextReminderDate && isToday(new Date(visit.nextReminderDate))
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          {user
            ? `Welcome, ${user.firstName || "User"}!`
            : "Welcome to your dashboard!"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{todayVisitsCount}</div>
          <p className="text-muted-foreground">Due Today</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-muted-foreground">Registered Pets</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-muted-foreground">Registered Owners</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-muted-foreground">Upcoming Vaccinations</p>
        </div>
      </div>

      {/* Upcoming Visits & Reminders Section */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Upcoming Visits & Reminders
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading upcoming visits..." />
            </div>
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-red-500">
                Error loading data: {(error as Error).message}
              </p>
            </div>
          ) : upcomingVisits.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm text-muted-foreground">
                Upcoming visits for the next 30 days
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium">Due Date</TableHead>
                  <TableHead className="font-medium">Pet Name</TableHead>
                  <TableHead className="font-medium">Owner</TableHead>
                  <TableHead className="font-medium">Visit Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {upcomingVisits.map((visit) => {
                  const reminderDate = visit.nextReminderDate
                    ? new Date(visit.nextReminderDate)
                    : null;
                  const isDueToday = reminderDate && isToday(reminderDate);

                  return (
                    <TableRow
                      key={visit.id}
                      className={`hover:bg-muted/50 ${
                        isDueToday ? "bg-amber-50" : ""
                      }`}
                    >
                      <TableCell className="font-medium">
                        {reminderDate ? (
                          <div className="flex items-center gap-2">
                            {format(reminderDate, "MMM d, yyyy")}
                            {isDueToday && (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 border-amber-200"
                              >
                                Today
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "Not set"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {visit.pet.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {visit.pet.owner.firstName} {visit.pet.owner.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={getVisitTypeBadgeColor(visit.visitType)}
                        >
                          {visit.visitType}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No upcoming visits found in the next 30 days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
