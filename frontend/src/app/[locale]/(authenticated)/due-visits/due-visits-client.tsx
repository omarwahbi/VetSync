"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import {
  ArrowLeft,
  RefreshCcw,
  X,
  Search,
  Filter,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SimplePagination } from "@/components/owners/SimplePagination";
import { useDebounce } from "@/lib/hooks/useDebounce";

// Constants
const PAGE_SIZES = [10, 20, 50, 100];
const VISIT_TYPES = [
  "ALL",
  "CHECKUP",
  "VACCINATION",
  "SURGERY",
  "EMERGENCY",
  "DENTAL",
];

// Interface for visit data
interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  pet: {
    id: string;
    name: string;
    species: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
  completed: boolean;
  notes?: string;
}

// Interface for paginated response
interface PaginatedResponse {
  data: Visit[];
  meta: {
    totalCount: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
  };
}

// Function to fetch visits due today
const fetchDueVisits = async (
  page = 1,
  limit = 20,
  searchTerm?: string,
  visitType?: string
): Promise<PaginatedResponse> => {
  const params: Record<string, string | number | undefined> = {
    page,
    limit,
    search: searchTerm || undefined,
    type: visitType && visitType !== "ALL" ? visitType : undefined,
  };

  // Remove undefined params
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) {
      delete params[key as keyof typeof params];
    }
  });

  const response = await axiosInstance.get("/visits/due-today", { params });
  return response.data;
};

// Function to get visit type badge color
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

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

export function DueVisitsClient() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("DueVisits");
  const visitsT = useTranslations("Visits");

  const router = useRouter();

  // State for table
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [visitType, setVisitType] = useState("ALL");

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Query for fetching due visits
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dueVisits", page, limit, debouncedSearchTerm, visitType],
    queryFn: () => fetchDueVisits(page, limit, debouncedSearchTerm, visitType),
  });

  // Extract visits and metadata
  const visits = data?.data || [];
  const meta = data?.meta;

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setVisitType("ALL");
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== "" || visitType !== "ALL";

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      // Direct implementation instead of relying on formatDisplayDate
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      // Format displays date like "29-04-2023"
      // Pad with leading zeros for single-digit days and months
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{t("dueVisitsList")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToDashboard")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and filter section */}
          <div className="px-6 py-4 border-b bg-muted/40">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 start-3 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                  placeholder={t("searchVisits")}
                  className="ps-10 w-full bg-white dark:bg-muted"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      handleFilterChange();
                    }}
                    className="absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="w-full sm:w-[200px]">
                <Select
                  value={visitType}
                  onValueChange={(value) => {
                    setVisitType(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <SelectValue
                      className=""
                      placeholder={t("selectVisitType")}
                    />
                  </SelectTrigger>
                  <SelectContent className="">
                    {VISIT_TYPES.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="flex items-center"
                      >
                        {type === "ALL"
                          ? visitsT("visitTypeAll")
                          : visitsT(
                              `visitType${
                                type.charAt(0) + type.slice(1).toLowerCase()
                              }`
                            )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md flex items-center">
                  <Filter className="me-1 h-3 w-3" />
                  {t("activeFilter")}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearFilters}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            )}
          </div>

          {/* Visit list content */}
          {isLoading ? (
            // Loading skeleton
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="py-8 text-center">
              <p className="text-red-500">
                {t("error")}: {(error as Error)?.message || t("unknownError")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCcw className="me-2 h-4 w-4" />
                {t("retry")}
              </Button>
            </div>
          ) : visits.length > 0 ? (
            // Due visits table
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("petName")}</TableHead>
                    <TableHead>{t("species")}</TableHead>
                    <TableHead>{t("ownerName")}</TableHead>
                    <TableHead>{t("contactInfo")}</TableHead>
                    <TableHead>{t("visitType")}</TableHead>
                    <TableHead>{t("time")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/${locale}/pets/${visit.pet.id}`}
                          className="hover:underline text-primary"
                        >
                          {visit.pet.name}
                        </Link>
                      </TableCell>
                      <TableCell>{visit.pet.species}</TableCell>
                      <TableCell>
                        <Link
                          href={`/${locale}/owners/${visit.pet.owner.id}`}
                          className="hover:underline text-primary"
                        >
                          {visit.pet.owner.firstName} {visit.pet.owner.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>{visit.pet.owner.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getVisitTypeBadgeColor(visit.visitType)}
                        >
                          {visit.visitType}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(visit.visitDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <CalendarX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-medium">{t("noVisitsToday")}</h3>
              <p className="text-muted-foreground mb-4">{t("allCaughtUp")}</p>
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/dashboard`)}
              >
                {t("backToDashboard")}
              </Button>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 0 && (
            <div className="px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <p className="text-sm font-medium">{t("rowsPerPage")}</p>
                  <Select
                    value={`${limit}`}
                    onValueChange={(value: string) => {
                      setLimit(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue
                        className=""
                        placeholder={limit.toString()}
                      />
                    </SelectTrigger>
                    <SelectContent className="">
                      {PAGE_SIZES.map((size) => (
                        <SelectItem
                          key={size}
                          value={`${size}`}
                          className="flex items-center"
                        >
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SimplePagination
                  currentPage={page}
                  totalPages={meta.totalPages}
                  totalCount={meta.totalCount}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
