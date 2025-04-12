"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Plus, Calendar, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
  initialFormData?: VisitFormValues;
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

// Function to fetch all pets to find the one we need
const fetchPet = async (petId: string): Promise<Pet> => {
  // Get all owners
  const ownersResponse = await axiosInstance.get("/owners");
  const owners = ownersResponse.data;

  // Iterate through owners to find the pet
  for (const owner of owners) {
    try {
      const petResponse = await axiosInstance.get(
        `/owners/${owner.id}/pets/${petId}`
      );
      return petResponse.data;
    } catch {
      // Continue searching if pet not found with this owner
      continue;
    }
  }

  throw new Error("Pet not found");
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

// Function to format date string for display
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "PPP");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

// Helper to indicate if reminders are enabled
const reminderStatusText = (isEnabled: boolean) => {
  return isEnabled ? "Enabled" : "Disabled";
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
  });

  // Function for creating a new visit
  const createVisitFn = async (newVisitData: VisitFormValues) => {
    // Format date for API if it exists
    const formattedData = {
      ...newVisitData,
      nextReminderDate: newVisitData.nextReminderDate
        ? newVisitData.nextReminderDate.toISOString()
        : undefined,
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
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });
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
    // Format date for API if it exists
    const formattedData = {
      ...data.updateData,
      nextReminderDate: data.updateData.nextReminderDate
        ? data.updateData.nextReminderDate.toISOString()
        : undefined,
    };

    const response = await axiosInstance.patch(
      `/pets/${petId}/visits/${data.visitId}`,
      formattedData
    );
    return response.data;
  };

  const { mutate: updateVisit, isPending: isUpdatingVisit } = useMutation({
    mutationFn: updateVisitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });
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
    const response = await axiosInstance.delete(
      `/pets/${petId}/visits/${visitId}`
    );
    return response.data;
  };

  const { mutate: deleteVisit, isPending: isDeletingVisit } = useMutation({
    mutationFn: deleteVisitFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });
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
    // Convert string dates to Date objects for the form
    const initialFormData: VisitFormValues = {
      visitDate: new Date(visit.visitDate),
      visitType: visit.visitType,
      notes: visit.notes || "",
      isReminderEnabled: Boolean(visit.isReminderEnabled),
      nextReminderDate: visit.nextReminderDate
        ? new Date(visit.nextReminderDate)
        : undefined,
    };

    console.log("Edit initialFormData:", initialFormData);

    setEditingVisit({
      ...visit,
      initialFormData,
    } as Visit & { initialFormData: VisitFormValues });

    setIsEditDialogOpen(true);
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
      <Card className="bg-white">
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
            <DialogContent className="sm:max-w-md">
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
                  <TableHead className="font-medium">Visit Date</TableHead>
                  <TableHead className="font-medium">Visit Type</TableHead>
                  <TableHead className="font-medium">Notes</TableHead>
                  <TableHead className="font-medium">Next Reminder</TableHead>
                  <TableHead className="font-medium">Reminder Status</TableHead>
                  <TableHead className="text-right font-medium">
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
                        {formatDate(visit.visitDate)}
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
                    <TableCell className="text-muted-foreground">
                      {visit.notes
                        ? visit.notes.length > 50
                          ? `${visit.notes.substring(0, 50)}...`
                          : visit.notes
                        : "No notes"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(visit.nextReminderDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {reminderStatusText(visit.isReminderEnabled)}
                    </TableCell>
                    <TableCell className="text-right">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold">Edit Visit</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the visit information
            </DialogDescription>
          </DialogHeader>
          {editingVisit && (
            <VisitForm
              initialData={editingVisit.initialFormData}
              onSubmit={handleUpdateVisit}
              onClose={() => setIsEditDialogOpen(false)}
              isLoading={isUpdatingVisit}
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
              from {formatDate(deletingVisit?.visitDate)}.
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
