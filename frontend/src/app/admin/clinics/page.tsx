"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Building2, Edit, Plus } from "lucide-react";
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
  subscriptionEndDate?: string;
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
  subscriptionEndDate?: Date | null;
}

// Function to fetch all clinics
const fetchAllClinics = async (): Promise<Clinic[]> => {
  const response = await axiosInstance.get("/admin/clinics");
  return response.data;
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
                  <TableHead className="font-medium">Reminders</TableHead>
                  <TableHead className="font-medium">
                    Subscription End
                  </TableHead>
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
                      <Badge
                        variant="outline"
                        className={
                          clinic.canSendReminders
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {clinic.canSendReminders ? "Enabled" : "Disabled"}
                      </Badge>
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
        <DialogContent className="sm:max-w-lg">
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
        <DialogContent className="sm:max-w-lg">
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
