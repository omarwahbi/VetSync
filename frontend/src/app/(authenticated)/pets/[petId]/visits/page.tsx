"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Plus, Calendar, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { formatDateForDisplay } from "@/lib/utils";

// Interface definitions
interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  notes?: string;
  nextReminderDate?: string;
  reminderSent: boolean;
  isReminderEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  petId: string;
  price?: number | null;
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
  initialFormData?: VisitFormValues;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  allowAutomatedReminders: boolean;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: string;
  ownerId: string;
  notes?: string;
  owner?: Owner;
  visits?: Visit[];
}

// Type definition for API error response
interface ErrorResponse {
  message: string;
}

// Function to fetch visits for a specific pet
const fetchVisits = async (petId: string): Promise<Visit[]> => {
  const response = await axiosInstance.get(`/pets/${petId}/visits`);
  return response.data;
};

// Function to fetch the pet directly
const fetchPet = async (petId: string): Promise<Pet> => {
  try {
    const response = await axiosInstance.get(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching pet details:", error);
    throw new Error("Pet not found");
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

// Helper to indicate if reminders are enabled
const reminderStatusText = (isEnabled: boolean) => {
  return isEnabled ? "Enabled" : "Disabled";
};

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

export default function PetVisitsPage() {
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);
  const params = useParams();
  const petId = params.petId as string;
  const queryClient = useQueryClient();

  // Query for fetching the pet's visits
  const {
    data: visits = [],
    isLoading: isLoadingVisits,
    error: visitsError,
    isError: isVisitsError,
  } = useQuery({
    queryKey: ["visits", petId],
    queryFn: () => fetchVisits(petId),
    enabled: !!petId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Query for fetching the pet's details
  const {
    data: pet,
    isLoading: isLoadingPet,
    error: petError,
    isError: isPetError,
  } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => fetchPet(petId),
    enabled: !!petId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Function for creating a new visit
  const createVisitFn = async (newVisitData: VisitFormValues) => {
    // Format dates for API
    const formattedData = {
      ...newVisitData,
      nextReminderDate: newVisitData.nextReminderDate
        ? newVisitData.nextReminderDate.toISOString()
        : null,
      price: newVisitData.price,
      // Include vital signs
      weight: newVisitData.weight,
      weightUnit: newVisitData.weightUnit || "kg",
      temperature: newVisitData.temperature,
      heartRate: newVisitData.heartRate,
      respiratoryRate: newVisitData.respiratoryRate,
      bloodPressure: newVisitData.bloodPressure,
      spo2: newVisitData.spo2,
      crt: newVisitData.crt,
      mmColor: newVisitData.mmColor,
      painScore: newVisitData.painScore,
    };

    const response = await axiosInstance.post(
      `/pets/${petId}/visits`,
      formattedData
    );
    return response.data;
  };

  const { mutate: createVisit, isPending: isCreatingVisit } = useMutation({
    mutationFn: createVisitFn,
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });

      toast.success("Visit added successfully");
      setIsVisitDialogOpen(false);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error creating visit:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create visit";
      toast.error(errorMessage);
    },
  });

  // Function for updating a visit
  const updateVisitFn = async (data: {
    visitId: string;
    updateData: VisitFormValues;
  }) => {
    const { visitId, updateData } = data;

    // Format dates for API
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

    const response = await axiosInstance.patch(
      `/pets/${petId}/visits/${visitId}`,
      formattedData
    );
    return response.data;
  };

  const { mutate: updateVisit, isPending: isUpdatingVisit } = useMutation({
    mutationFn: updateVisitFn,
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });

      toast.success("Visit updated successfully");
      setIsEditDialogOpen(false);
      setEditingVisit(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error updating visit:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update visit";
      toast.error(errorMessage);
    },
  });

  // Function for deleting a visit
  const deleteVisitFn = async (visitId: string) => {
    await axiosInstance.delete(`/pets/${petId}/visits/${visitId}`);
    return visitId; // Return the visitId for use in onSuccess
  };

  const { mutate: deleteVisit, isPending: isDeletingVisit } = useMutation({
    mutationFn: deleteVisitFn,
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });

      toast.success("Visit deleted successfully");
      setDeletingVisit(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error deleting visit:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete visit";
      toast.error(errorMessage);
      setDeletingVisit(null);
    },
  });

  const handleCreateVisit = (data: VisitFormValues) => {
    createVisit(data);
  };

  const handleEditClick = (visit: Visit) => {
    setEditingVisit(visit);
    setIsEditDialogOpen(true);

    // Prepare initial form data for the visit form component
    visit.initialFormData = {
      visitDate: new Date(visit.visitDate),
      visitType: visit.visitType,
      notes: visit.notes || "",
      isReminderEnabled: visit.isReminderEnabled,
      nextReminderDate: visit.nextReminderDate
        ? new Date(visit.nextReminderDate)
        : undefined,
      price: visit.price,
      // Include vital signs
      weight: visit.weight,
      weightUnit: visit.weightUnit as "kg" | "lb" | undefined,
      temperature: visit.temperature,
      heartRate: visit.heartRate,
      respiratoryRate: visit.respiratoryRate,
      bloodPressure: visit.bloodPressure,
      spo2: visit.spo2,
      crt: visit.crt,
      mmColor: visit.mmColor,
      painScore: visit.painScore,
    };
  };

  const handleUpdateVisit = (formData: VisitFormValues) => {
    if (!editingVisit) {
      toast.error("Cannot update visit: Missing visit information");
      return;
    }

    updateVisit({
      visitId: editingVisit.id,
      updateData: formData,
    });
  };

  const handleDeleteClick = (visit: Visit) => {
    setDeletingVisit(visit);
  };

  const confirmDeleteVisit = () => {
    if (!deletingVisit) {
      toast.error("Cannot delete visit: Missing visit information");
      return;
    }

    deleteVisit(deletingVisit.id);
  };

  const isLoading = isLoadingVisits || isLoadingPet;
  const isError = isVisitsError || isPetError;
  const error = visitsError || petError;

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            {isLoadingPet
              ? "Loading Pet Details..."
              : pet
              ? `Visits for ${pet.name}`
              : "Pet Visits"}
          </CardTitle>
          <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-1"
                disabled={!petId}
              >
                <Plus className="h-4 w-4" />
                New Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-bold">
                  Add New Visit
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Fill in the details to record a new visit
                </DialogDescription>
              </DialogHeader>
              <VisitForm
                onSubmit={handleCreateVisit}
                onClose={() => setIsVisitDialogOpen(false)}
                isLoading={isCreatingVisit}
                selectedPetData={pet}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading visits..." />
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                Error loading data: {(error as Error).message}
              </p>
            </div>
          ) : visits && visits.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm text-muted-foreground">
                A list of all visits for this pet.
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium w-36">Date</TableHead>
                  <TableHead className="font-medium w-28">Type</TableHead>
                  <TableHead className="font-medium w-28">Price</TableHead>
                  <TableHead className="font-medium w-28">Weight</TableHead>
                  <TableHead className="font-medium w-36">Next Visit</TableHead>
                  <TableHead className="font-medium w-28">Reminder</TableHead>
                  <TableHead className="font-medium">Notes</TableHead>
                  <TableHead className="text-end font-medium w-12">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {visits.map((visit) => (
                  <TableRow key={visit.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDateForDisplay(visit.visitDate)}
                      </div>
                    </TableCell>
                    <TableCell className="">
                      <Badge
                        variant="outline"
                        className={getVisitTypeBadgeColor(visit.visitType)}
                      >
                        {visit.visitType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(visit.price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {visit.weight
                        ? `${visit.weight} ${visit.weightUnit || "kg"}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateForDisplay(visit.nextReminderDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Badge
                        variant={
                          visit.isReminderEnabled ? "default" : "outline"
                        }
                        className={
                          visit.isReminderEnabled
                            ? "bg-green-500 hover:bg-green-500"
                            : ""
                        }
                      >
                        {reminderStatusText(visit.isReminderEnabled)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {visit.notes || "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => handleEditClick(visit)}
                            className="cursor-pointer"
                            inset={false}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(visit)}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            inset={false}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No visits recorded for this pet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold">Edit Visit</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the visit information
            </DialogDescription>
          </DialogHeader>
          {editingVisit && editingVisit.initialFormData && (
            <VisitForm
              initialData={{
                ...editingVisit.initialFormData,
                visitDate: editingVisit.initialFormData.visitDate,
                visitType: editingVisit.initialFormData.visitType,
                isReminderEnabled:
                  editingVisit.initialFormData.isReminderEnabled,
                notes: editingVisit.initialFormData.notes,
                nextReminderDate: editingVisit.initialFormData.nextReminderDate,
                pet: {
                  id: petId,
                  owner: pet?.owner,
                },
              }}
              onSubmit={handleUpdateVisit}
              onClose={() => setIsEditDialogOpen(false)}
              isLoading={isUpdatingVisit}
              selectedPetData={pet}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Visit Confirmation Dialog */}
      <AlertDialog
        open={!!deletingVisit}
        onOpenChange={(open) => !open && setDeletingVisit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-medium">
                {deletingVisit?.visitType} visit
              </span>{" "}
              from {formatDateForDisplay(deletingVisit?.visitDate)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVisit}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeletingVisit}
            >
              {isDeletingVisit ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
