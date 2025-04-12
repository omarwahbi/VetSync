"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { format } from "date-fns";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Calendar, Search, X, Filter, MoreHorizontal } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

// Constants
const ITEMS_PER_PAGE = 20;
const VISIT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "checkup", label: "Checkup" },
  { value: "vaccination", label: "Vaccination" },
  { value: "surgery", label: "Surgery" },
  { value: "emergency", label: "Emergency" },
  { value: "dental", label: "Dental" },
];

// Interface for visit data
interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  notes: string;
  nextReminderDate: string | null;
  isReminderEnabled: boolean;
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
}

// Interface for API response
interface VisitsResponse {
  data: Visit[];
  meta: {
    totalCount: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
  };
}

// Function to fetch visits with pagination and filters
const fetchVisits = async ({
  pageParam = 1,
  searchTerm,
  visitType,
  dateRange,
}: {
  pageParam?: number;
  searchTerm?: string;
  visitType?: string;
  dateRange?: DateRange;
}) => {
  const params: Record<string, string | number | undefined> = {
    page: pageParam,
    limit: ITEMS_PER_PAGE,
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

  const response = await axiosInstance.get<VisitsResponse>("/visits/all", {
    params,
  });
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

// Function to determine reminder status badge
const getReminderStatusBadge = (
  isEnabled: boolean,
  nextDate: string | null
) => {
  if (!isEnabled) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        Disabled
      </Badge>
    );
  }

  if (!nextDate) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        Not Set
      </Badge>
    );
  }

  const reminderDate = new Date(nextDate);
  const today = new Date();
  const timeDiff = reminderDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysDiff < 0) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        Overdue
      </Badge>
    );
  } else if (daysDiff === 0) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800">
        Today
      </Badge>
    );
  } else if (daysDiff <= 7) {
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800">
        Soon
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        Scheduled
      </Badge>
    );
  }
};

export default function VisitsPage() {
  // Add state for dialogs and mutations
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);
  const queryClient = useQueryClient();

  // State for pagination and filters
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [visitTypeFilter, setVisitTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Debounce search term to prevent too many requests
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, visitTypeFilter, dateRange]);

  // Query for fetching visits with filters
  const {
    data: response,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["visits", page, debouncedSearchTerm, visitTypeFilter, dateRange],
    queryFn: () =>
      fetchVisits({
        pageParam: page,
        searchTerm: debouncedSearchTerm,
        visitType: visitTypeFilter,
        dateRange,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update visit mutation
  const updateVisitFn = async (data: {
    petId: string;
    visitId: string;
    updateData: VisitFormValues;
  }) => {
    const { petId, visitId, updateData } = data;

    // Format dates for API
    const formattedData = {
      ...updateData,
      visitDate: updateData.visitDate.toISOString(),
      nextReminderDate: updateData.nextReminderDate
        ? updateData.nextReminderDate.toISOString()
        : undefined,
    };

    const response = await axiosInstance.patch(
      `/pets/${petId}/visits/${visitId}`,
      formattedData
    );
    return response.data;
  };

  const { mutate: updateVisit, isPending: isUpdatingVisit } = useMutation({
    mutationFn: updateVisitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
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
      queryClient.invalidateQueries({ queryKey: ["visits"] });
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
  const visits = response?.data || [];
  const meta = response?.meta;

  // Function to clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setVisitTypeFilter("all");
    setDateRange(undefined);
    setPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters =
    debouncedSearchTerm || visitTypeFilter !== "all" || dateRange?.from;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clinic Visits</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all clinic visits
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              All Clinic Visits
            </div>
          </CardTitle>
        </CardHeader>

        {/* Filter controls */}
        <div className="px-6 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[240px]">
                <DateRangePicker
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  placeholder="Filter by date range"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search visits..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-8 pr-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-0"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[180px]">
                <Select
                  value={visitTypeFilter}
                  onValueChange={setVisitTypeFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by visit type" />
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
            </div>

            {hasActiveFilters && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  Clear all filters
                </Button>
                <div className="ml-4 text-sm text-muted-foreground">
                  {meta?.totalCount !== undefined && (
                    <span>
                      {meta.totalCount}{" "}
                      {meta.totalCount === 1 ? "visit" : "visits"} found
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading visits..." />
            </div>
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-red-500">
                Error loading data: {(error as Error).message}
              </p>
            </div>
          ) : visits.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm text-muted-foreground">
                Showing page {meta?.currentPage} of {meta?.totalPages} (
                {meta?.totalCount} total visits)
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium">Visit Date</TableHead>
                  <TableHead className="font-medium">Pet</TableHead>
                  <TableHead className="font-medium">Owner</TableHead>
                  <TableHead className="font-medium">Visit Type</TableHead>
                  <TableHead className="font-medium">Next Reminder</TableHead>
                  <TableHead className="font-medium">Reminder Status</TableHead>
                  <TableHead className="font-medium w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {visits.map((visit: Visit) => {
                  const visitDate = new Date(visit.visitDate);
                  const reminderDate = visit.nextReminderDate
                    ? new Date(visit.nextReminderDate)
                    : null;

                  return (
                    <TableRow key={visit.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {format(visitDate, "MMM d, yyyy")}
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
                      <TableCell className="text-muted-foreground">
                        {reminderDate
                          ? format(reminderDate, "MMM d, yyyy")
                          : "Not set"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getReminderStatusBadge(
                          visit.isReminderEnabled,
                          visit.nextReminderDate
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
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
                              className="cursor-pointer"
                              inset={false}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleDeleteClick(visit)}
                              inset={false}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "No visits match your filters."
                  : "No visits found."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="px-6 py-6 border-t">
              <div className="flex flex-col items-center">
                <div className="text-sm text-muted-foreground mb-3">
                  Page {meta.currentPage} of {meta.totalPages} (
                  {meta.totalCount} total visits)
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
                        }}
                        aria-disabled={meta.currentPage <= 1}
                        className={
                          meta.currentPage <= 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {/* Generate page numbers */}
                    {Array.from({ length: Math.min(5, meta.totalPages) }).map(
                      (_, i) => {
                        // Logic to show pages around current page
                        let pageNum;
                        if (meta.totalPages <= 5) {
                          // If 5 or fewer pages, show all page numbers
                          pageNum = i + 1;
                        } else if (meta.currentPage <= 3) {
                          // If near the start, show first 5 pages
                          pageNum = i + 1;
                        } else if (meta.currentPage >= meta.totalPages - 2) {
                          // If near the end, show last 5 pages
                          pageNum = meta.totalPages - 4 + i;
                        } else {
                          // Otherwise show current page and 2 pages before and after
                          pageNum = meta.currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              isActive={pageNum === meta.currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(pageNum);
                              }}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.min(meta.totalPages, p + 1));
                        }}
                        aria-disabled={meta.currentPage >= meta.totalPages}
                        className={
                          meta.currentPage >= meta.totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the visit record for{" "}
              <span className="font-semibold">{deletingVisit?.pet.name}</span>{" "}
              on{" "}
              {deletingVisit?.visitDate
                ? format(new Date(deletingVisit.visitDate), "MMMM d, yyyy")
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
