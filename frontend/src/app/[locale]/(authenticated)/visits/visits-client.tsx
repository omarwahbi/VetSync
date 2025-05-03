"use client";

import { useState, useEffect } from "react";
import {
  useRouter,
  useParams,
  useSearchParams,
  usePathname,
} from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import {
  Plus,
  Search,
  Filter,
  RefreshCcw,
  X,
  PawPrint,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";
import { SimplePagination } from "@/components/owners/SimplePagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatDisplayDate } from "@/lib/utils";
import { QuickAddVisitModal } from "@/components/forms/quick-add-visit-modal";

// Constants
const PAGE_SIZES = [10, 20, 50, 100];
const VISIT_TYPES = [
  { value: "ALL", label: "visitTypeAll" },
  { value: "checkup", label: "visitTypeCheckup" },
  { value: "vaccination", label: "visitTypeVaccination" },
  { value: "surgery", label: "visitTypeSurgery" },
  { value: "emergency", label: "visitTypeEmergency" },
  { value: "dental", label: "visitTypeDental" },
  { value: "grooming", label: "visitTypeGrooming" },
  { value: "other", label: "visitTypeOther" },
];

// Interface for visit data
interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  notes?: string;
  isReminderEnabled: boolean;
  nextReminderDate?: string | null;
  reminderSent: boolean;
  price?: number | null;
  // Vital signs
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
    species?: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      allowAutomatedReminders?: boolean;
    };
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

// Interface for paginated response
interface PaginatedResponse {
  data: Visit[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Function to fetch visits
const fetchVisits = async (
  page = 1,
  limit = 20,
  searchTerm?: string,
  visitType?: string,
  status?: string,
  dateRange?: DateRange
): Promise<PaginatedResponse> => {
  const params: Record<string, string | number | undefined> = {
    page,
    limit,
    search: searchTerm || undefined,
    visitType:
      visitType && visitType.toUpperCase() !== "ALL"
        ? visitType.toLowerCase()
        : undefined,
    status: status && status !== "ALL" ? status.toLowerCase() : undefined,
    startDate: dateRange?.from
      ? dateRange.from.toISOString().split("T")[0]
      : undefined,
    endDate: dateRange?.to
      ? dateRange.to.toISOString().split("T")[0]
      : undefined,
  };

  // Remove undefined params
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) {
      delete params[key as keyof typeof params];
    }
  });

  console.log("Fetching visits with params:", params);
  const response = await axiosInstance.get("/visits/all", { params });
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
    case "grooming":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

export function VisitsClient() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("Visits");
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get initial values from URL parameters
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  // Normalize case of visitType to match the VISIT_TYPES values
  const rawVisitType = searchParams.get("visitType");
  const initialVisitType = rawVisitType
    ? VISIT_TYPES.find(
        (type) => type.value.toLowerCase() === rawVisitType.toLowerCase()
      )?.value || "ALL"
    : "ALL";
  const initialSearchTerm = searchParams.get("search") || "";

  // State for filters - now initialized from URL params
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [visitType, setVisitType] = useState(initialVisitType);
  const [status, setStatus] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // State for edit/delete
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // New state for quick add visit modal
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  // Effect to update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    // Only add parameters that aren't default values
    if (page !== 1) params.set("page", page.toString());
    if (searchTerm) params.set("search", searchTerm);
    if (visitType !== "ALL") {
      // For vaccination types, preserve "vaccination" lowercase format from dashboard
      const value =
        visitType.toLowerCase() === "vaccination" ? "vaccination" : visitType;
      params.set("visitType", value);
    }

    // Update the URL without refreshing the page
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [page, searchTerm, visitType, pathname, router]);

  // Query for fetching visits
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "visits",
      page,
      limit,
      debouncedSearchTerm,
      visitType,
      status,
      dateRange?.from?.toISOString().split("T")[0],
      dateRange?.to?.toISOString().split("T")[0],
    ],
    queryFn: () =>
      fetchVisits(
        page,
        limit,
        debouncedSearchTerm,
        visitType,
        status,
        dateRange
      ),
  });

  // Extract visits and metadata
  const visits = data?.data || [];
  const pagination = data?.pagination;

  // Handlers for edit and delete operations
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
      toast.success(t("visitUpdatedSuccess"));
      setIsEditDialogOpen(false);
      setSelectedVisit(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Error updating visit:", error);
      const errorMessage =
        error.response?.data?.message || t("failedToUpdateVisit");
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
      toast.success(t("visitDeletedSuccess"));
      setIsDeleteDialogOpen(false);
      setSelectedVisit(null);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Error deleting visit:", error);
      const errorMessage =
        error.response?.data?.message || t("failedToDeleteVisit");
      toast.error(errorMessage);
    },
  });

  // Handler functions
  const handleEditClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateVisit = (data: VisitFormValues) => {
    if (!selectedVisit) return;

    updateVisit({
      petId: selectedVisit.pet.id,
      visitId: selectedVisit.id,
      updateData: data,
    });
  };

  const handleDeleteClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteVisit = () => {
    if (!selectedVisit) return;

    deleteVisit({
      petId: selectedVisit.pet.id,
      visitId: selectedVisit.id,
    });
  };

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setVisitType("ALL");
    setStatus("ALL");
    setDateRange(undefined);
    setPage(1);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return formatDisplayDate(dateString);
    } catch {
      return dateString;
    }
  };

  // Check if any active filters
  const hasActiveFilters =
    searchTerm !== "" ||
    visitType !== "ALL" ||
    status !== "ALL" ||
    dateRange?.from !== undefined ||
    dateRange?.to !== undefined;

  return (
    <div className="space-y-6" dir="auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-start">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-start">
            {t("subtitle")}
          </p>
        </div>
        <Button
          onClick={() => setIsVisitModalOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="me-2 h-4 w-4" />
          {t("newVisit")}
        </Button>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-start">{t("visitList")}</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Search and filter section */}
          <div className="py-4 border-b bg-muted/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 start-3 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                  placeholder={t("searchVisits")}
                  className="ps-10 w-full bg-white dark:bg-muted text-start"
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

              {/* Type filter */}
              <div>
                <Select
                  value={visitType}
                  onValueChange={(value) => {
                    setVisitType(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-muted text-start">
                    <SelectValue placeholder={t("filterByType")} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {VISIT_TYPES.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="flex items-center text-start"
                      >
                        {t(type.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date range picker */}
              <div>
                <DateRangePicker
                  dateRange={dateRange}
                  onChange={setDateRange}
                  onApply={handleFilterChange}
                />
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
          <div className="mt-4">
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
            ) : isError ? (
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
              // Visits table
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t("date")}</TableHead>
                      <TableHead className="text-start">
                        {locale === "en" ? "Visit Type" : "نوع الزيارة"}
                      </TableHead>
                      <TableHead className="text-start">
                        {t("petName")}
                      </TableHead>
                      <TableHead className="text-start">
                        {t("ownerName")}
                      </TableHead>
                      <TableHead className="text-end">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => {
                      return (
                        <TableRow key={visit.id}>
                          <TableCell className="whitespace-nowrap text-start">
                            {formatDate(visit.visitDate)}
                          </TableCell>
                          <TableCell className="text-start">
                            <Badge
                              variant="outline"
                              className={getVisitTypeBadgeColor(
                                visit.visitType
                              )}
                            >
                              {t(
                                `visitType${
                                  visit.visitType.charAt(0).toUpperCase() +
                                  visit.visitType.slice(1).toLowerCase()
                                }`
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-start">
                            <Link
                              href={`/${locale}/pets/${visit.pet.id}`}
                              className="hover:underline text-primary"
                            >
                              {visit.pet.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-start">
                            <Link
                              href={`/${locale}/owners/${visit.pet.owner.id}`}
                              className="hover:underline text-primary"
                            >
                              {visit.pet.owner.firstName}{" "}
                              {visit.pet.owner.lastName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => {
                                  handleEditClick(visit);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t("edit")}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  handleDeleteClick(visit);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">{t("delete")}</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <PawPrint className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-medium">
                  {t("noVisitsFound")}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {t("startByCreating")}
                </p>
                <Button onClick={() => setIsVisitModalOpen(true)}>
                  <Plus className="me-2 h-4 w-4" />
                  {t("newVisit")}
                </Button>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 0 && (
              <div className="px-2 py-4 border-t mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <p className="text-sm font-medium">{t("rowsPerPage")}</p>
                    <Select
                      value={`${limit}`}
                      onValueChange={(value: string) => {
                        setLimit(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-muted">
                        <SelectValue placeholder={limit.toString()} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
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
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editVisit")}</DialogTitle>
            <DialogDescription>
              {selectedVisit &&
                t("editVisitDescription", { name: selectedVisit.pet.name })}
            </DialogDescription>
          </DialogHeader>
          {selectedVisit && (
            <VisitForm
              initialData={{
                id: selectedVisit.id,
                petId: selectedVisit.pet.id,
                visitDate: new Date(selectedVisit.visitDate),
                visitType: selectedVisit.visitType,
                notes: selectedVisit.notes || "",
                nextReminderDate: selectedVisit.nextReminderDate
                  ? new Date(selectedVisit.nextReminderDate)
                  : undefined,
                isReminderEnabled: selectedVisit.isReminderEnabled,
                price: selectedVisit.price,
                pet: {
                  id: selectedVisit.pet.id,
                  name: selectedVisit.pet.name,
                  owner: {
                    id: selectedVisit.pet.owner.id,
                    allowAutomatedReminders:
                      selectedVisit.pet.owner.allowAutomatedReminders,
                  },
                },
                // Include vital signs if available
                weight: selectedVisit.weight,
                weightUnit: selectedVisit.weightUnit,
                temperature: selectedVisit.temperature,
                heartRate: selectedVisit.heartRate,
                respiratoryRate: selectedVisit.respiratoryRate,
                bloodPressure: selectedVisit.bloodPressure,
                spo2: selectedVisit.spo2,
                crt: selectedVisit.crt,
                mmColor: selectedVisit.mmColor,
                painScore: selectedVisit.painScore,
              }}
              onSubmit={handleUpdateVisit}
              onClose={() => setIsEditDialogOpen(false)}
              isLoading={isUpdatingVisit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Visit Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteVisit")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteVisit")}
              {selectedVisit && (
                <span className="block mt-2 font-medium">
                  {formatDate(selectedVisit.visitDate)} -{" "}
                  {selectedVisit.pet.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteVisit}
              disabled={isDeletingVisit}
            >
              {isDeletingVisit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                t("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
