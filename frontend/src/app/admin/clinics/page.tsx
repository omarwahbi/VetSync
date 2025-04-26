"use client";

import { useState } from "react";
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

// Interface for clinic data
interface Clinic {
  id: string;
  name: string;
  isActive: boolean;
  canSendReminders: boolean;
  address?: string;
  phone?: string;
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
  isActive?: boolean;
  canSendReminders?: boolean;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  reminderMonthlyLimit?: number;
}

// Function to fetch all clinics
const fetchAllClinics = async (): Promise<Clinic[]> => {
  const response = await axiosInstance.get("/admin/clinics");
  // Log the raw response for debugging
  console.log("Clinics page - Raw clinic response:", response.data);

  // Handle both response formats - the new one with data & meta, or the old direct array
  const clinicsData = response.data.data || response.data;

  // Log the extracted clinics data
  console.log("Clinics page - Extracted clinics data:", clinicsData);

  const clinicsList = Array.isArray(clinicsData) ? clinicsData : [];

  // Log the final list
  console.log("Clinics page - Final clinics list:", clinicsList);

  return clinicsList;
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

export default function ClinicsPage() {
  // State for dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Query for fetching clinics
  const {
    data: clinics = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["adminClinics"],
    queryFn: fetchAllClinics,
  });

  // Mutation for creating clinic
  const { mutate: createClinic, isPending: isCreatingClinic } = useMutation({
    mutationFn: createClinicFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminClinics"] });
      toast.success("Clinic created successfully");
      setIsCreateDialogOpen(false);
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
      setIsEditDialogOpen(false);
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
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Manage Clinics
          </CardTitle>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add New Clinic
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading clinics..." />
            </div>
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-red-500">
                Error loading data: {(error as Error).message}
              </p>
            </div>
          ) : clinics.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm text-muted-foreground">
                List of all registered clinics on the platform
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Reminder Limit</TableHead>
                  <TableHead className="font-medium">Sent This Cycle</TableHead>
                  <TableHead className="font-medium">
                    Current Cycle Start
                  </TableHead>
                  <TableHead className="font-medium">Sub Start</TableHead>
                  <TableHead className="font-medium">Sub End</TableHead>
                  <TableHead className="font-medium text-right">
                    Owner Count
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    Pet Count
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {clinics.map((clinic) => (
                  <TableRow key={clinic.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{clinic.name}</TableCell>
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
                            "MMM d, yyyy"
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clinic.subscriptionStartDate
                        ? format(
                            new Date(clinic.subscriptionStartDate),
                            "MMM d, yyyy"
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clinic.subscriptionEndDate
                        ? format(
                            new Date(clinic.subscriptionEndDate),
                            "MMM d, yyyy"
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {clinic.ownerCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {clinic.petCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-semibold">
              Edit Clinic Settings
            </DialogTitle>
          </DialogHeader>
          {editingClinic && (
            <AdminClinicSettingsForm
              initialData={editingClinic}
              onSubmit={handleUpdateClinic}
              onClose={() => setIsEditDialogOpen(false)}
              isLoading={isUpdatingClinic}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Clinic Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-semibold">
              Create New Clinic
            </DialogTitle>
          </DialogHeader>
          <AdminCreateClinicForm
            onSubmit={handleCreateClinic}
            onClose={() => setIsCreateDialogOpen(false)}
            isLoading={isCreatingClinic}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
