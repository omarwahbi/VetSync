"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Search,
  X,
  Filter,
  MoreHorizontal,
  RefreshCcw,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { Plus } from "lucide-react";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";
import { SimplePagination } from "@/components/owners/SimplePagination";

// Constants
const PAGE_SIZES = [10, 20, 50, 100];
const ITEMS_PER_PAGE = PAGE_SIZES[1]; // Default to 20

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
  weight?: number | null;
  weightUnit?: "kg" | "lb";
  temperature?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  bloodPressure?: string | null;
  spo2?: number | null;
  crt?: string | null;
  mmColor?: string | null;
  painScore?: number | null;
  pet: {
    id: string;
    name: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      allowAutomatedReminders: boolean;
    };
  };
  createdBy?: User;
  updatedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for API response
interface VisitsResponse {
  data: Visit[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Function to fetch visits with pagination and filters
const fetchVisits = async ({
  pageParam = 1,
  limitParam = ITEMS_PER_PAGE,
  searchTerm,
  visitType,
  dateRange,
}: {
  pageParam?: number;
  limitParam?: number;
  searchTerm?: string;
  visitType?: string;
  dateRange?: DateRange;
}) => {
  console.log("API Call: Fetching visits with filters:", {
    pageParam,
    limitParam,
    searchTerm,
    visitType,
    dateRangeFrom: dateRange?.from
      ? dateRange.from.toISOString().split("T")[0]
      : null,
    dateRangeTo: dateRange?.to
      ? dateRange.to.toISOString().split("T")[0]
      : null,
  });

  const params: Record<string, string | number | undefined> = {
    page: pageParam,
    limit: limitParam,
    search: searchTerm || undefined,
    visitType: visitType === "all" ? undefined : visitType || undefined,
    startDate: dateRange?.from
      ? dateRange.from.toISOString().split("T")[0]
      : undefined,
    endDate: dateRange?.to
      ? dateRange.to.toISOString().split("T")[0]
      : undefined,
  };

  // Remove undefined properties from params before sending
  Object.keys(params).forEach(
    (key) => params[key] === undefined && delete params[key]
  );

  console.log("API Call: Params being sent to server:", params);

  try {
    const response = await axiosInstance.get<VisitsResponse>("/visits/all", {
      params,
    });
    console.log(
      "API Call: Response received with",
      response.data.data.length,
      "visits"
    );
    return response.data;
  } catch (error) {
    console.error("API Call: Error fetching visits:", error);
    throw error;
  }
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

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

// Function to format currency
const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "N/A";

  // Format with commas and 2 decimal places
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "IQD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function VisitsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Visit types with hardcoded English labels
  const VISIT_TYPES = [
    { value: "all", label: "All Types" },
    { value: "checkup", label: "Checkup" },
    { value: "vaccination", label: "Vaccination" },
    { value: "surgery", label: "Surgery" },
    { value: "emergency", label: "Emergency" },
    { value: "dental", label: "Dental" },
  ];

  // Flag to track manual filter changes vs. URL-driven changes
  const isManualFilterChange = useRef(false);
  const isInitialRender = useRef(true);

  // Get initial state from URL parameters or use defaults
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialStatusFilter = searchParams.get("status") || "ALL";
  const initialVisitTypeFilter = searchParams.get("visitType") || "all";
  const initialLimit = parseInt(
    searchParams.get("limit") || String(ITEMS_PER_PAGE),
    10
  );

  // Get date range from URL - use ISO strings for dates
  const initialStartDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate") || "")
    : undefined;
  const initialEndDate = searchParams.get("endDate")
    ? new Date(searchParams.get("endDate") || "")
    : undefined;

  // Add state for dialogs and mutations
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);

  // State for pagination and filters (derived from URL)
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [visitTypeFilter, setVisitTypeFilter] = useState(
    initialVisitTypeFilter
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialStartDate || initialEndDate
      ? { from: initialStartDate, to: initialEndDate }
      : undefined
  );
  const [page, setPage] = useState(currentPage);
  const [limit, setLimit] = useState(initialLimit);

  // Add new state to store pending filter values
  const [pendingSearchTerm, setPendingSearchTerm] = useState(initialSearch);
  const [pendingDateRange, setPendingDateRange] = useState<
    DateRange | undefined
  >(
    initialStartDate || initialEndDate
      ? { from: initialStartDate, to: initialEndDate }
      : undefined
  );

  // Function to apply all pending filters at once
  const applyFilters = () => {
    console.log("Manually applying filters", {
      searchTerm: pendingSearchTerm,
      dateRange: pendingDateRange,
    });

    isManualFilterChange.current = true;

    // Apply all pending filters to the actual state
    setSearchTerm(pendingSearchTerm);
    setDateRange(pendingDateRange);
    setPage(1); // Reset to page 1 when applying new filters
  };

  // Function to reset all filters
  const clearFilters = () => {
    console.log("Manually clearing all filters");
    isManualFilterChange.current = true;

    // Reset both pending and active filters
    setPendingSearchTerm("");
    setPendingDateRange(undefined);

    setSearchTerm("");
    setStatusFilter("ALL");
    setVisitTypeFilter("all");
    setDateRange(undefined);
    setPage(1);
  };

  // Debounce search term to prevent too many requests
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Create query string function
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      // Start with a fresh URLSearchParams object
      const urlParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          // Skip null/undefined/empty values
        } else {
          // Don't add limit to URL if it's the default value
          if (key === "limit" && value === ITEMS_PER_PAGE) {
            // Skip default limit
          } else {
            urlParams.set(key, value.toString());
          }
        }
      });

      return urlParams.toString();
    },
    []
  );

  // Update URL when filters change manually
  useEffect(() => {
    if (!isManualFilterChange.current) {
      return; // Skip if not a manual change
    }

    console.log("Updating URL due to manual filter change", {
      page,
      searchTerm,
      visitTypeFilter,
      dateRange,
    });

    // Always go to page 1 when filters change manually
    const newPage = isManualFilterChange.current ? 1 : page;

    const params: Record<string, string | number | null> = {
      page: newPage,
      search: searchTerm || null,
      visitType: visitTypeFilter === "all" ? null : visitTypeFilter,
      status: statusFilter === "ALL" ? null : statusFilter,
      startDate: dateRange?.from
        ? dateRange.from.toISOString().split("T")[0]
        : null,
      endDate: dateRange?.to ? dateRange.to.toISOString().split("T")[0] : null,
      limit: limit === ITEMS_PER_PAGE ? null : limit,
    };

    const queryString = createQueryString(params);

    // Use replace to avoid browser history issues
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });

    // Reset manual flag after URL update
    isManualFilterChange.current = false;

    // Update the page state if we changed it
    if (newPage !== page) {
      setPage(newPage);
    }
  }, [
    router,
    pathname,
    page,
    searchTerm,
    visitTypeFilter,
    statusFilter,
    dateRange,
    limit,
    createQueryString,
  ]);

  // Handle URL parameter changes (like browser back button or manual URL editing)
  useEffect(() => {
    // Skip on initial render to avoid conflicts with initial state
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Skip if this was a manual filter change that triggered the URL update
    if (isManualFilterChange.current) {
      return;
    }

    console.log("URL params changed externally, updating state");

    const newPage = parseInt(searchParams.get("page") || "1", 10);
    const newSearch = searchParams.get("search") || "";
    const newVisitType = searchParams.get("visitType") || "all";
    const newStatus = searchParams.get("status") || "ALL";
    const newLimit = parseInt(
      searchParams.get("limit") || String(ITEMS_PER_PAGE),
      10
    );

    const newStartDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate") || "")
      : undefined;
    const newEndDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate") || "")
      : undefined;

    const newDateRange =
      newStartDate || newEndDate
        ? { from: newStartDate, to: newEndDate }
        : undefined;

    // Update state only if values actually changed
    if (newPage !== page) setPage(newPage);
    if (newSearch !== searchTerm) setSearchTerm(newSearch);
    if (newVisitType !== visitTypeFilter) setVisitTypeFilter(newVisitType);
    if (newStatus !== statusFilter) setStatusFilter(newStatus);
    if (newLimit !== limit) setLimit(newLimit);

    // Special comparison for date range
    const currentStartStr = dateRange?.from?.toISOString().split("T")[0];
    const currentEndStr = dateRange?.to?.toISOString().split("T")[0];
    const newStartStr = newStartDate?.toISOString().split("T")[0];
    const newEndStr = newEndDate?.toISOString().split("T")[0];

    if (currentStartStr !== newStartStr || currentEndStr !== newEndStr) {
      setDateRange(newDateRange);
    }
  }, [searchParams]);

  // Fetch visits with proper query key
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "visits",
      page,
      limit,
      debouncedSearchTerm,
      visitTypeFilter,
      statusFilter,
      dateRange?.from?.toISOString().split("T")[0], // Use string values in query key
      dateRange?.to?.toISOString().split("T")[0],
    ],
    queryFn: () =>
      fetchVisits({
        pageParam: page,
        limitParam: limit,
        searchTerm: debouncedSearchTerm,
        visitType: visitTypeFilter,
        dateRange,
      }),
  });

  // Generate a key based on search params to force remount on change
  const componentKey = searchParams.toString();

  // Function to update a visit
  const updateVisitFn = async (data: {
    petId: string;
    visitId: string;
    updateData: VisitFormValues;
  }) => {
    const { petId, visitId, updateData } = data;

    // Format dates and prepare data for the API
    const formattedData = {
      ...updateData,
      visitDate: updateData.visitDate.toISOString(),
      nextReminderDate: updateData.nextReminderDate
        ? updateData.nextReminderDate.toISOString()
        : null,
      price: updateData.price,
      // Include vital signs
      weight: updateData.weight,
      weightUnit: updateData.weightUnit || "kg",
      temperature: updateData.temperature,
      heartRate: updateData.heartRate,
      respiratoryRate: updateData.respiratoryRate,
      bloodPressure: updateData.bloodPressure,
      spo2: updateData.spo2,
      crt: updateData.crt,
      mmColor: updateData.mmColor,
      painScore: updateData.painScore,
    };

    // Send the update request
    try {
      const response = await axiosInstance.patch(
        `/pets/${petId}/visits/${visitId}`,
        formattedData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating visit:", error);
      throw error;
    }
  };

  const { mutate: updateVisit, isPending: isUpdatingVisit } = useMutation({
    mutationFn: updateVisitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits", "all"] });
      toast.success("Visit updated successfully");
      setIsEditDialogOpen(false);
      setEditingVisit(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Error updating visit:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update visit";
      toast.error(errorMessage);
    },
  });

  // Delete visit mutation
  const deleteVisitFn = async (data: { petId: string; visitId: string }) => {
    const { petId, visitId } = data;
    const response = await axiosInstance.delete(
      `/pets/${petId}/visits/${visitId}`
    );
    return response.data;
  };

  const { mutate: deleteVisit, isPending: isDeletingVisit } = useMutation({
    mutationFn: deleteVisitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits", "all"] });
      toast.success("Visit deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingVisit(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Error deleting visit:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete visit";
      toast.error(errorMessage);
    },
  });

  // Handler functions
  const handleEditClick = (visit: Visit) => {
    // Set the current visit for editing
    setEditingVisit(visit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateVisit = (data: VisitFormValues) => {
    if (!editingVisit) return;

    updateVisit({
      petId: editingVisit.pet.id,
      visitId: editingVisit.id,
      updateData: data,
    });
  };

  const handleDeleteClick = (visit: Visit) => {
    setDeletingVisit(visit);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteVisit = () => {
    if (!deletingVisit) return;

    deleteVisit({
      petId: deletingVisit.pet.id,
      visitId: deletingVisit.id,
    });
  };

  // Extract visits and metadata
  const visits = data?.data || [];
  const pagination = data?.pagination;

  // Check if any filters are active
  const hasActiveFilters =
    debouncedSearchTerm ||
    visitTypeFilter !== "all" ||
    statusFilter !== "ALL" ||
    dateRange?.from ||
    dateRange?.to;

  // Column visibility state
  const [visitColumnsVisibility, setVisitColumnsVisibility] = useState({
    visitDate: true,
    pet: true,
    owner: true,
    visitType: true,
    nextReminder: true,
    price: true,
    weight: true,
    createdBy: false,
    updatedBy: false,
    createdAt: false,
    updatedAt: false,
    actions: true,
  });

  // Function to toggle column visibility
  const toggleColumn = (column: keyof typeof visitColumnsVisibility) => {
    setVisitColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visits</h1>
        <p className="text-muted-foreground mt-2">
          Manage and view your pet visits.
        </p>
      </div>

      <Card className="bg-white dark:bg-card" key={componentKey}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Visits
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 me-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("visitDate")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.visitDate && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Date
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("pet")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.pet && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Pet
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("owner")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.owner && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Owner
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("visitType")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.visitType && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Type
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("nextReminder")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.nextReminder && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Next Reminder
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("price")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.price && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Price
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("weight")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.weight && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Weight
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("createdBy")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.createdBy && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Created By
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("updatedBy")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.updatedBy && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Updated By
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("createdAt")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.createdAt && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Created At
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("updatedAt")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.updatedAt && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Updated At
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("actions")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.actions && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Actions
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Filter controls */}
        <div className="px-6 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              {/* Date Range Picker */}
              <div className="flex-1 min-w-[240px]">
                <DateRangePicker
                  dateRange={pendingDateRange}
                  setDateRange={setPendingDateRange}
                  placeholder="Filter by date range"
                />
              </div>

              {/* Search Field */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search visits"
                    value={pendingSearchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPendingSearchTerm(e.target.value)
                    }
                    className="pl-8 pr-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applyFilters();
                      }
                    }}
                  />
                  {pendingSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-0"
                      onClick={() => setPendingSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Visit Type Dropdown - auto fetch on change */}
              <div className="flex-1 min-w-[180px]">
                <Select
                  value={visitTypeFilter}
                  onValueChange={(value: string) => {
                    isManualFilterChange.current = true;
                    setVisitTypeFilter(value);
                    setPage(1); // Reset to page 1 when changing visit type
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select visit type" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {VISIT_TYPES.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="cursor-pointer"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unified Search Button */}
              <Button
                type="button"
                size="default"
                onClick={applyFilters}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                <Search className="h-4 w-4 me-2" />
                Apply Filters
              </Button>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <Filter className="h-3.5 w-3.5 me-1" />
                  Clear Filters
                </Button>
                <div className="ml-4 text-sm text-muted-foreground">
                  {pagination && pagination.totalCount !== undefined && (
                    <span>
                      {pagination.totalCount} visit
                      {pagination.totalCount === 1 ? "" : "s"} found
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="w-full overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    {visitColumnsVisibility.visitDate && (
                      <TableHead className="font-medium">Date</TableHead>
                    )}
                    {visitColumnsVisibility.pet && (
                      <TableHead className="font-medium">Pet</TableHead>
                    )}
                    {visitColumnsVisibility.owner && (
                      <TableHead className="font-medium">Owner</TableHead>
                    )}
                    {visitColumnsVisibility.visitType && (
                      <TableHead className="font-medium">Type</TableHead>
                    )}
                    {visitColumnsVisibility.price && (
                      <TableHead className="font-medium">Price</TableHead>
                    )}
                    {visitColumnsVisibility.weight && (
                      <TableHead className="font-medium">Weight</TableHead>
                    )}
                    {visitColumnsVisibility.nextReminder && (
                      <TableHead className="font-medium">
                        Next Reminder
                      </TableHead>
                    )}
                    {visitColumnsVisibility.createdBy && (
                      <TableHead className="font-medium">Created By</TableHead>
                    )}
                    {visitColumnsVisibility.updatedBy && (
                      <TableHead className="font-medium">Updated By</TableHead>
                    )}
                    {visitColumnsVisibility.createdAt && (
                      <TableHead className="font-medium">Created At</TableHead>
                    )}
                    {visitColumnsVisibility.updatedAt && (
                      <TableHead className="font-medium">Updated At</TableHead>
                    )}
                    {visitColumnsVisibility.actions && (
                      <TableHead className="font-medium text-center w-20">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="hover:bg-muted/50"
                    >
                      {visitColumnsVisibility.visitDate && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.pet && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.owner && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.visitType && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.price && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.weight && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.nextReminder && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.createdBy && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.updatedBy && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.createdAt && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.updatedAt && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {visitColumnsVisibility.actions && (
                        <TableCell className="text-center">
                          <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                Error loading visits:{" "}
                {(error as Error)?.message || "Unknown error"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : visits.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm text-muted-foreground">
                Showing page {currentPage} of {pagination?.totalPages} (
                {pagination?.totalCount} total visits)
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  {visitColumnsVisibility.visitDate && (
                    <TableHead className="font-medium">Date</TableHead>
                  )}
                  {visitColumnsVisibility.pet && (
                    <TableHead className="font-medium">Pet</TableHead>
                  )}
                  {visitColumnsVisibility.owner && (
                    <TableHead className="font-medium">Owner</TableHead>
                  )}
                  {visitColumnsVisibility.visitType && (
                    <TableHead className="font-medium">Type</TableHead>
                  )}
                  {visitColumnsVisibility.price && (
                    <TableHead className="font-medium">Price</TableHead>
                  )}
                  {visitColumnsVisibility.weight && (
                    <TableHead className="font-medium">Weight</TableHead>
                  )}
                  {visitColumnsVisibility.nextReminder && (
                    <TableHead className="font-medium">Next Reminder</TableHead>
                  )}
                  {visitColumnsVisibility.createdBy && (
                    <TableHead className="font-medium">Created By</TableHead>
                  )}
                  {visitColumnsVisibility.updatedBy && (
                    <TableHead className="font-medium">Updated By</TableHead>
                  )}
                  {visitColumnsVisibility.createdAt && (
                    <TableHead className="font-medium">Created At</TableHead>
                  )}
                  {visitColumnsVisibility.updatedAt && (
                    <TableHead className="font-medium">Updated At</TableHead>
                  )}
                  {visitColumnsVisibility.actions && (
                    <TableHead className="font-medium text-center w-20">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {visits.map((visit: Visit) => {
                  return (
                    <TableRow key={visit.id} className="hover:bg-muted/50">
                      {visitColumnsVisibility.visitDate && (
                        <TableCell className="font-medium">
                          {formatDisplayDate(visit.visitDate)}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.pet && (
                        <TableCell className="text-muted-foreground">
                          {visit.pet.name}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.owner && (
                        <TableCell className="text-muted-foreground">
                          {visit.pet.owner.firstName} {visit.pet.owner.lastName}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.visitType && (
                        <TableCell className="text-muted-foreground">
                          <Badge
                            variant="outline"
                            className={getVisitTypeBadgeColor(visit.visitType)}
                          >
                            {visit.visitType}
                          </Badge>
                        </TableCell>
                      )}
                      {visitColumnsVisibility.price && (
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatCurrency(visit.price)}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.weight && (
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {visit.weight
                            ? `${visit.weight} ${visit.weightUnit || "kg"}`
                            : "-"}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.nextReminder && (
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {visit.nextReminderDate
                            ? formatDisplayDate(visit.nextReminderDate)
                            : "-"}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.createdBy && (
                        <TableCell className="text-muted-foreground">
                          {visit.createdBy
                            ? `${visit.createdBy.firstName || ""} ${
                                visit.createdBy.lastName || ""
                              }`.trim() || "Unknown"
                            : "System"}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.updatedBy && (
                        <TableCell className="text-muted-foreground">
                          {visit.updatedBy
                            ? `${visit.updatedBy.firstName || ""} ${
                                visit.updatedBy.lastName || ""
                              }`.trim() || "Unknown"
                            : "System"}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.createdAt && (
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDisplayDateTime(visit.createdAt)}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.updatedAt && (
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {formatDisplayDateTime(visit.updatedAt)}
                        </TableCell>
                      )}
                      {visitColumnsVisibility.actions && (
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuItem
                                onClick={() => handleEditClick(visit)}
                                className="cursor-pointer text-left"
                                inset={false}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer text-left"
                                onClick={() => handleDeleteClick(visit)}
                                inset={false}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters
                  ? "No visits match your filters. Try adjusting or clearing your filters."
                  : "No visits recorded yet. Add your first visit to get started."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              ) : (
                <Button onClick={() => setIsEditDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record New Visit
                </Button>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {data?.pagination && data.pagination.totalCount > 0 && (
            <div className="px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${limit}`}
                    onValueChange={(value: string) => {
                      const newLimit = Number(value);
                      isManualFilterChange.current = true;
                      setLimit(newLimit);

                      // Let the URL update effect handle the URL change
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={limit} />
                    </SelectTrigger>
                    <SelectContent side="top" className="">
                      {PAGE_SIZES.map((pageSize) => (
                        <SelectItem
                          key={pageSize}
                          value={`${pageSize}`}
                          className=""
                        >
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SimplePagination
                  currentPage={page}
                  totalPages={Math.ceil(
                    (data?.pagination?.totalCount ?? 0) / limit
                  )}
                  totalCount={data?.pagination?.totalCount ?? 0}
                  onPageChange={(newPage) => {
                    console.log("Manual page change to", newPage);
                    isManualFilterChange.current = true;
                    setPage(newPage);
                    // Let the URL update effect handle the URL change
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Visit</DialogTitle>
            <DialogDescription>
              Update the visit details for {editingVisit?.pet.name}.
            </DialogDescription>
          </DialogHeader>
          {editingVisit && (
            <VisitForm
              initialData={{
                id: editingVisit.id,
                petId: editingVisit.pet.id,
                visitDate: new Date(editingVisit.visitDate),
                visitType: editingVisit.visitType,
                notes: editingVisit.notes,
                nextReminderDate: editingVisit.nextReminderDate
                  ? new Date(editingVisit.nextReminderDate)
                  : undefined,
                isReminderEnabled: editingVisit.isReminderEnabled,
                price: editingVisit.price,
                pet: {
                  id: editingVisit.pet.id,
                  name: editingVisit.pet.name,
                  owner: {
                    id: editingVisit.pet.owner.id,
                    allowAutomatedReminders:
                      editingVisit.pet.owner.allowAutomatedReminders,
                  },
                },
              }}
              onSubmit={handleUpdateVisit}
              onClose={() => setIsEditDialogOpen(false)}
              isLoading={isUpdatingVisit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Visit Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the visit record for{" "}
              <span className="font-semibold">{deletingVisit?.pet.name}</span>{" "}
              on{" "}
              {deletingVisit?.visitDate
                ? formatDisplayDate(deletingVisit.visitDate)
                : "unknown date"}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVisit}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingVisit}
            >
              {isDeletingVisit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
