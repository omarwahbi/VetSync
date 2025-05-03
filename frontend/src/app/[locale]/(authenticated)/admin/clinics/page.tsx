"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Building2, Edit, Plus, AlertCircle } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminClinicSettingsForm } from "@/components/forms/admin-clinic-settings-form";
import {
  AdminCreateClinicForm,
  CreateClinicFormValues,
} from "@/components/forms/admin-create-clinic-form";
import { useDebounce } from "@/hooks/use-debounce";

// Interface for clinic data
interface Clinic {
  id: string;
  name: string;
  isActive: boolean;
  canSendReminders: boolean;
  address?: string;
  phone?: string;
  timezone?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  reminderMonthlyLimit?: number;
  reminderSentThisCycle?: number;
  currentCycleStartDate?: string;
  ownerCount?: number;
  petCount?: number;
  createdAt: string;
}

// Interface for update data
interface ClinicUpdateData {
  name?: string;
  address?: string;
  phone?: string;
  timezone?: string;
  isActive?: boolean;
  canSendReminders?: boolean;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  reminderMonthlyLimit?: number;
}

// Function to fetch all clinics with filters
const fetchClinics = async ({
  page = 1,
  search = "",
  isActive,
}: {
  page?: number;
  search?: string;
  isActive?: boolean;
}): Promise<{
  data: Clinic[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}> => {
  const params: Record<string, string | number | boolean> = {
    page,
    search: search || "",
  };

  if (isActive !== undefined) params.isActive = isActive;

  const response = await axiosInstance.get("/admin/clinics", { params });

  // Handle both new and old API response formats
  if (response.data.data && response.data.meta) {
    return response.data;
  }

  // If the old format (just an array), convert to expected format
  const clinics = Array.isArray(response.data) ? response.data : [];
  return {
    data: clinics,
    meta: {
      totalItems: clinics.length,
      itemCount: clinics.length,
      itemsPerPage: clinics.length,
      totalPages: 1,
      currentPage: 1,
    },
  };
};

// Function to create a new clinic
const createClinicFn = async (createData: CreateClinicFormValues) => {
  const response = await axiosInstance.post("/admin/clinics", createData);
  return response.data;
};

// Function to update a clinic
const updateClinicFn = async ({
  clinicId,
  updateData,
}: {
  clinicId: string;
  updateData: ClinicUpdateData;
}) => {
  const response = await axiosInstance.patch(
    `/admin/clinics/${clinicId}`,
    updateData
  );
  return response.data;
};

// Helper function to render reminder usage with visual indicators
const renderReminderUsage = (
  sent: number | undefined,
  limit: number | undefined,
  canSendReminders: boolean
) => {
  const sentCount = sent ?? 0;

  // If reminders are disabled system-wide
  if (!canSendReminders) {
    return (
      <div className="flex items-center">
        <span className="text-muted-foreground">{sentCount}</span>
        <AlertCircle className="h-4 w-4 ml-1 text-gray-400" />
      </div>
    );
  }

  // If unlimited reminders
  if (limit === -1) {
    return (
      <div className="flex items-center">
        <span className="font-medium">{sentCount}</span>
        <span className="text-muted-foreground ml-1">/ ∞</span>
      </div>
    );
  }

  // If reminders are disabled by limit
  if (limit === 0) {
    return (
      <div className="flex items-center">
        <span className="text-muted-foreground">{sentCount}</span>
        <AlertCircle className="h-4 w-4 ml-1 text-gray-400" />
      </div>
    );
  }

  // Calculate usage percentage for warnings
  const usagePercent = limit ? (sentCount / limit) * 100 : 0;
  let textColorClass = "text-muted-foreground";

  if (usagePercent >= 90) {
    textColorClass = "text-red-600 font-semibold";
  } else if (usagePercent >= 75) {
    textColorClass = "text-amber-600 font-medium";
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className={textColorClass}>{sentCount}</span>
        <span className="text-muted-foreground ml-1">/ {limit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
        <div
          className={`h-1 rounded-full ${
            usagePercent >= 90
              ? "bg-red-500"
              : usagePercent >= 75
              ? "bg-amber-500"
              : "bg-green-500"
          }`}
          style={{ width: `${Math.min(100, usagePercent)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function AdminClinicsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get initial state from URL parameters or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialStatusFilter = searchParams.get("status") || "ALL";

  // State using URL values as initial values
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [isCreateClinicOpen, setIsCreateClinicOpen] = useState(false);
  const [isEditClinicOpen, setIsEditClinicOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

  // Use debounced search term to prevent frequent API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Function to create a query string from parameters
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | undefined>) => {
      const currentParams = new URLSearchParams(
        Array.from(searchParams.entries())
      );

      // Update or delete parameters
      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          String(value).length === 0 ||
          (typeof value === "string" && value === "ALL")
        ) {
          currentParams.delete(key);
        } else {
          currentParams.set(key, String(value));
        }
      });

      // Always reset page to 1 when filters (not page itself) change
      if (Object.keys(paramsToUpdate).some((k) => k !== "page")) {
        currentParams.set("page", "1");
      }

      return currentParams.toString();
    },
    [searchParams]
  );

  // Update URL when filters change
  useEffect(() => {
    const query = createQueryString({
      page,
      search: debouncedSearchTerm,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    });

    // This will preserve the locale in the URL
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [
    page,
    debouncedSearchTerm,
    statusFilter,
    router,
    pathname,
    createQueryString,
  ]);

  // Update local state if URL changes externally (like browser back button)
  useEffect(() => {
    const newPage = parseInt(searchParams.get("page") || "1", 10);
    const newSearch = searchParams.get("search") || "";
    const newStatus = searchParams.get("status") || "ALL";

    if (newPage !== page) setPage(newPage);
    if (newSearch !== searchTerm) setSearchTerm(newSearch);
    if (newStatus !== statusFilter) setStatusFilter(newStatus);
  }, [searchParams, page, searchTerm, statusFilter]);

  // Query for fetching clinics
  const {
    data: clinicsData,
    isLoading: isLoadingClinics,
    isError: isClinicsError,
    error: clinicsError,
  } = useQuery({
    queryKey: ["adminClinics", page, debouncedSearchTerm, statusFilter],
    queryFn: () =>
      fetchClinics({
        page,
        search: debouncedSearchTerm,
        isActive:
          statusFilter === "ACTIVE"
            ? true
            : statusFilter === "INACTIVE"
            ? false
            : undefined,
      }),
  });

  const clinics = clinicsData?.data || [];
  const meta = clinicsData?.meta || {
    totalItems: 0,
    itemCount: 0,
    itemsPerPage: 0,
    totalPages: 1,
    currentPage: 1,
  };

  // Mutation for creating clinic
  const { mutate: createClinic, isPending: isCreatingClinic } = useMutation({
    mutationFn: createClinicFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClinics"] });
      toast.success("Clinic created successfully");
      setIsCreateClinicOpen(false);
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to create clinic");
    },
  });

  // Mutation for updating clinic
  const { mutate: updateClinic, isPending: isUpdatingClinic } = useMutation({
    mutationFn: updateClinicFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClinics"] });
      toast.success("Clinic settings have been updated successfully.");
      setIsEditClinicOpen(false);
    },
    onError: (error) => {
      toast.error((error as Error).message || "Something went wrong");
    },
  });

  // Handle clinic create
  const handleCreateClinic = (formData: CreateClinicFormValues) => {
    createClinic(formData);
  };

  // Handle clinic update
  const handleUpdateClinic = (formData: ClinicUpdateData) => {
    if (editingClinic?.id) {
      updateClinic({
        clinicId: editingClinic.id,
        updateData: formData,
      });
    }
  };

  // Handle edit button click
  const handleEditClick = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setIsEditClinicOpen(true);
  };

  // Render the component
  return (
    <div>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Manage Clinics
          </CardTitle>
          <Button size="sm" onClick={() => setIsCreateClinicOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add New Clinic
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingClinics ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading clinics..." />
            </div>
          ) : isClinicsError ? (
            <div className="py-4 text-center">
              <p className="text-red-500">
                Error loading data: {(clinicsError as Error).message}
              </p>
            </div>
          ) : clinics.length > 0 ? (
            <>
              <Table className="w-full">
                <TableCaption className="text-sm text-muted-foreground">
                  List of all registered clinics on the platform
                </TableCaption>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Timezone</TableHead>
                    <TableHead className="font-medium">
                      Reminder Limit
                    </TableHead>
                    <TableHead className="font-medium">
                      Sent This Cycle
                    </TableHead>
                    <TableHead className="font-medium">
                      Current Cycle Start
                    </TableHead>
                    <TableHead className="font-medium">Sub Start</TableHead>
                    <TableHead className="font-medium">Sub End</TableHead>
                    <TableHead className="font-medium text-end">
                      Owner Count
                    </TableHead>
                    <TableHead className="font-medium text-end">
                      Pet Count
                    </TableHead>
                    <TableHead className="font-medium text-end">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {clinics.map((clinic: Clinic) => (
                    <TableRow key={clinic.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {clinic.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            clinic.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {clinic.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clinic.timezone || "UTC"}
                      </TableCell>
                      <TableCell>
                        {!clinic.canSendReminders ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800 hover:bg-red-100"
                          >
                            Disabled (System)
                          </Badge>
                        ) : clinic.reminderMonthlyLimit === -1 ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                          >
                            Unlimited
                          </Badge>
                        ) : clinic.reminderMonthlyLimit === 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800 hover:bg-gray-100"
                          >
                            Disabled (Limit)
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {clinic.reminderMonthlyLimit} / cycle
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {renderReminderUsage(
                          clinic.reminderSentThisCycle,
                          clinic.reminderMonthlyLimit,
                          clinic.canSendReminders
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clinic.currentCycleStartDate
                          ? format(
                              new Date(clinic.currentCycleStartDate),
                              "dd-MM-yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clinic.subscriptionStartDate
                          ? format(
                              new Date(clinic.subscriptionStartDate),
                              "dd-MM-yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clinic.subscriptionEndDate
                          ? format(
                              new Date(clinic.subscriptionEndDate),
                              "dd-MM-yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground">
                        {clinic.ownerCount ?? 0}
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground">
                        {clinic.petCount ?? 0}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(clinic)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta && meta.totalPages > 1 && (
                <div className="px-6 py-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Showing page {meta.currentPage} of {meta.totalPages} (
                      {meta.totalItems} total clinics)
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = Math.max(1, page - 1);
                          setPage(newPage);

                          // Directly update URL to trigger the API call
                          const paramsToUpdate = {
                            page: newPage === 1 ? undefined : newPage,
                            search: debouncedSearchTerm || undefined,
                            status:
                              statusFilter === "ALL" ? undefined : statusFilter,
                          };

                          const queryString = createQueryString(paramsToUpdate);
                          router.push(
                            `${pathname}${
                              queryString ? `?${queryString}` : ""
                            }`,
                            { scroll: false }
                          );
                        }}
                        disabled={page <= 1}
                      >
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {page} of {meta.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = Math.min(meta.totalPages, page + 1);
                          setPage(newPage);

                          // Directly update URL to trigger the API call
                          const paramsToUpdate = {
                            page: newPage === 1 ? undefined : newPage,
                            search: debouncedSearchTerm || undefined,
                            status:
                              statusFilter === "ALL" ? undefined : statusFilter,
                          };

                          const queryString = createQueryString(paramsToUpdate);
                          router.push(
                            `${pathname}${
                              queryString ? `?${queryString}` : ""
                            }`,
                            { scroll: false }
                          );
                        }}
                        disabled={page >= meta.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No clinics found in the system.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Clinic Dialog */}
      <Dialog open={isEditClinicOpen} onOpenChange={setIsEditClinicOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-start">
            <DialogTitle className="text-lg font-semibold">
              Edit Clinic Settings
            </DialogTitle>
          </DialogHeader>
          {editingClinic && (
            <AdminClinicSettingsForm
              initialData={editingClinic}
              onSubmit={handleUpdateClinic}
              onClose={() => setIsEditClinicOpen(false)}
              isLoading={isUpdatingClinic}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Clinic Dialog */}
      <Dialog open={isCreateClinicOpen} onOpenChange={setIsCreateClinicOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-start">
            <DialogTitle className="text-lg font-semibold">
              Create New Clinic
            </DialogTitle>
          </DialogHeader>
          <AdminCreateClinicForm
            onSubmit={handleCreateClinic}
            onClose={() => setIsCreateClinicOpen(false)}
            isLoading={isCreatingClinic}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
