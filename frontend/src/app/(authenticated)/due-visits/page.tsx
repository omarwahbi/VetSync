"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { CalendarCheck2, MessageSquare, RefreshCcw } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils";
import { formatPhoneNumberForWhatsApp } from "@/lib/phoneUtils";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimplePagination } from "@/components/owners/SimplePagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Interface for user who created/updated the visit
interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

// Interface for visit data
interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  notes: string;
  nextReminderDate: string | null;
  isReminderEnabled: boolean;
  price: number | null;
  pet: {
    id: string;
    name: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      allowAutomatedReminders: boolean;
    };
  };
  createdBy?: User;
  updatedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for API response with pagination
interface VisitsResponse {
  data: Visit[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Function to fetch visits due today
const fetchDueTodayVisits = async (page = 1, limit = 20) => {
  const response = await axiosInstance.get<VisitsResponse>(
    "/visits/due-today",
    {
      params: { page, limit },
    }
  );
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

// Function to format reminder status as readable text
const reminderStatusText = (isEnabled: boolean) => {
  return isEnabled ? "Enabled" : "Disabled";
};

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`}></div>
);

// Define page sizes constant
const PAGE_SIZES = [10, 20, 50, 100];

export default function DueVisitsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch visits due today
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dueTodayVisits", currentPage, pageSize],
    queryFn: () => fetchDueTodayVisits(currentPage, pageSize),
  });

  const dueVisits = data?.data || [];
  const pagination = data?.pagination || {
    totalCount: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5" />
            <span>Visits Due Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5" />
            <span>Visits Due Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-4">
            <div className="text-sm text-destructive">
              Error loading visits due today. Please try again later.
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  const emptyState = (
    <div className="text-center py-8">
      <CalendarCheck2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium">No visits due today</h3>
      <p className="text-sm text-muted-foreground mt-1">
        All reminders are up to date.
      </p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck2 className="h-5 w-5" />
          <span>Visits Due Today</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dueVisits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Due</TableHead>
                <TableHead>Pet Name</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead>Owner Phone</TableHead>
                <TableHead>Visit Type</TableHead>
                <TableHead>Reminder Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {dueVisits.map((visit) => (
                <TableRow key={visit.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {visit.nextReminderDate
                      ? formatDisplayDate(visit.nextReminderDate)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/pets/${visit.pet.id}`}
                      className="text-primary hover:underline"
                    >
                      {visit.pet.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/owners/${visit.pet.owner.id}`}
                      className="text-primary hover:underline"
                    >
                      {`${visit.pet.owner.firstName} ${visit.pet.owner.lastName}`}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{visit.pet.owner.phone}</span>
                      {formatPhoneNumberForWhatsApp(visit.pet.owner.phone) && (
                        <a
                          href={`https://wa.me/${formatPhoneNumberForWhatsApp(
                            visit.pet.owner.phone
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700"
                          title={`Chat with ${visit.pet.owner.firstName} on WhatsApp`}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getVisitTypeBadgeColor(visit.visitType)}
                    >
                      {visit.visitType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={visit.isReminderEnabled ? "default" : "outline"}
                      className={
                        visit.isReminderEnabled
                          ? "bg-green-500 hover:bg-green-500"
                          : ""
                      }
                    >
                      {reminderStatusText(visit.isReminderEnabled)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          emptyState
        )}
      </CardContent>

      {/* Pagination with Page Size Selector */}
      {dueVisits.length > 0 && pagination && (
        <div className="px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value: string) => {
                  setPageSize(Number(value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top" className="">
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={`${size}`} className="">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SimplePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
