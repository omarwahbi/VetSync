"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";
import {
  PawPrint,
  User,
  ClipboardList,
  PlusCircle,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  Bell,
  BellOff,
  Cake,
  Diamond,
  VenetianMask,
  Trash2,
  Loader2,
  SlidersHorizontal,
  Check,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import {
  Dialog,
  DialogContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PetForm, PetFormValues } from "@/components/forms/pet-form";
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
}

interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  notes: string | null;
  nextReminderDate: string | null;
  isReminderEnabled: boolean;
  price: number | null;
  createdBy?: User;
  updatedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birthDate: string | null;
  notes: string | null;
  owner: Owner;
  visits?: Visit[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: User;
  updatedBy?: User;
}

// Type definition for API error response
interface ErrorResponse {
  message: string;
}

// Function to fetch pet details with its owner and visits
const fetchPetDetails = async (petId: string): Promise<Pet> => {
  const response = await axiosInstance.get(`/pets/${petId}`);
  return response.data;
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

export default function PetDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.petId as string;
  const queryClient = useQueryClient();

  // Dialog states
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [isVisitEditDialogOpen, setIsVisitEditDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);

  // Column visibility state for visits table - simplified
  const [visitColumnsVisibility, setVisitColumnsVisibility] = useState({
    date: true,
    type: true,
    notes: true,
    nextReminder: true,
    reminderStatus: true,
    price: true,
    createdBy: false,
    updatedBy: false,
    actions: true,
  });

  const {
    data: petData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => fetchPetDetails(petId),
    enabled: !!petId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Update pet mutation
  const { mutate: updatePet, isPending: isUpdatingPet } = useMutation({
    mutationFn: async (formData: PetFormValues) => {
      const response = await axiosInstance.patch(
        `/owners/${petData?.owner?.id}/pets/${petId}`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the pet cache
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      setIsPetDialogOpen(false);
      toast.success("Pet updated successfully");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Error updating pet: ${errorMessage}`);
    },
  });

  // Create visit mutation
  const { mutate: createVisit, isPending: isCreatingVisit } = useMutation({
    mutationFn: async (formData: VisitFormValues) => {
      // Format dates for API
      const formattedData = {
        ...formData,
        visitDate: formData.visitDate.toISOString(),
        nextReminderDate: formData.nextReminderDate
          ? formData.nextReminderDate.toISOString()
          : null,
        price: formData.price,
      };

      const response = await axiosInstance.post(
        `/pets/${petId}/visits`,
        formattedData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });

      setIsVisitDialogOpen(false);
      toast.success("Visit created successfully");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Error creating visit: ${errorMessage}`);
    },
  });

  // Update visit mutation
  const { mutate: updateVisit, isPending: isUpdatingVisit } = useMutation({
    mutationFn: async (data: {
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
      };

      const response = await axiosInstance.patch(
        `/pets/${petId}/visits/${visitId}`,
        formattedData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });

      setIsVisitEditDialogOpen(false);
      setEditingVisit(null);
      toast.success("Visit updated successfully");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Error updating visit: ${errorMessage}`);
    },
  });

  // Delete pet mutation
  const { mutate: deletePet, isPending: isDeletingPet } = useMutation({
    mutationFn: async (ids: { ownerId: string; petId: string }) => {
      const response = await axiosInstance.delete(
        `/owners/${ids.ownerId}/pets/${ids.petId}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Pet deleted successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pets"] });

      if (petData?.owner?.id) {
        queryClient.invalidateQueries({
          queryKey: ["owner", petData.owner.id],
        });
      }

      // Redirect to the owner's detail page or pets list
      if (petData?.owner?.id) {
        router.push(`/owners/${petData.owner.id}`);
      } else {
        router.push("/pets");
      }
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Error deleting pet: ${errorMessage}`);
    },
  });

  // Delete visit mutation
  const { mutate: deleteVisit, isPending: isDeletingVisit } = useMutation({
    mutationFn: async (ids: { petId: string; visitId: string }) => {
      await axiosInstance.delete(`/pets/${ids.petId}/visits/${ids.visitId}`);
      return ids.visitId; // Return the visitId for cache updates
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });

      toast.success("Visit deleted successfully");
      setDeletingVisit(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Error deleting visit: ${errorMessage}`);
      setDeletingVisit(null);
    },
  });

  // Function to toggle column visibility
  const toggleColumn = (column: keyof typeof visitColumnsVisibility) => {
    setVisitColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleUpdatePet = (formData: PetFormValues) => {
    // Convert dates to ISO strings for API
    const formattedData = {
      ...formData,
      // Convert dates to ISO strings for API if needed
      birthDate: formData.birthDate ? formData.birthDate : null,
    };

    updatePet(formattedData);
  };

  const handleCreateVisit = (formData: VisitFormValues) => {
    createVisit(formData);
  };

  const handleUpdateVisit = (formData: VisitFormValues) => {
    if (!editingVisit || !editingVisit.id) {
      toast.error("Cannot update visit: Missing visit information");
      return;
    }

    updateVisit({
      visitId: editingVisit.id,
      updateData: formData,
    });
  };

  const handleDeletePet = () => {
    if (!petData || !petData.owner || !petData.owner.id) {
      toast.error("Cannot delete pet: Missing owner information");
      return;
    }

    deletePet({
      ownerId: petData.owner.id,
      petId,
    });
  };

  const confirmDeleteVisit = () => {
    if (!deletingVisit?.id) {
      toast.error("Cannot delete visit: Missing visit information");
      return;
    }

    deleteVisit({
      petId,
      visitId: deletingVisit.id,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pets">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Pets
            </Link>
          </Button>
        </div>

        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Pet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <PawPrint className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="flex items-center">
                <Diamond className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center">
                <VenetianMask className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center">
                <Cake className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Visit History</CardTitle>
          </CardHeader>
          <CardContent className="">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !petData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pets">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Pets
            </Link>
          </Button>
        </div>

        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Pet Details</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="text-red-500">
              Error loading pet details:{" "}
              {(error as Error)?.message || "Could not load pet data"}
            </div>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/pets">Return to Pets List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/pets">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Pets
          </Link>
        </Button>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Pet Details</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsPetDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Pet
            </Button>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Pet
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    pet <span className="font-medium">{petData?.name}</span> and
                    all associated visits.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletePet}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeletingPet}
                  >
                    {isDeletingPet ? (
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <PawPrint className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="font-medium text-lg">{petData.name}</span>
            </div>

            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="font-medium mr-2">Owner:</span>
              <Link
                href={`/owners/${petData.owner.id}`}
                className="text-primary hover:underline"
              >
                {petData.owner.firstName} {petData.owner.lastName}
              </Link>
            </div>

            <div className="flex items-center">
              <Diamond className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="font-medium mr-2">Species:</span>
              <span>{petData.species}</span>
            </div>

            {petData.breed && (
              <div className="flex items-center">
                <VenetianMask className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium mr-2">Breed:</span>
                <span>{petData.breed}</span>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Birth Date
              </p>
              <p className="text-base">
                {formatDisplayDate(petData.birthDate)}
              </p>
            </div>

            {petData.gender && (
              <div className="flex items-center">
                <span className="font-medium mr-2">Gender:</span>
                <span>
                  {petData.gender.charAt(0).toUpperCase() +
                    petData.gender.slice(1)}
                </span>
              </div>
            )}

            {petData.notes && (
              <div className="mt-4">
                <span className="font-medium">Notes:</span>
                <p className="mt-1 text-muted-foreground">{petData.notes}</p>
              </div>
            )}

            {/* Audit Information */}
            <div className="text-xs text-muted-foreground mt-4">
              <p>Created: {formatDisplayDateTime(petData.createdAt)}</p>
              {petData.updatedAt && petData.updatedAt !== petData.createdAt && (
                <p>Last updated: {formatDisplayDateTime(petData.updatedAt)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-muted-foreground" />
            Visit History
          </CardTitle>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("type")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.type && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Type
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("notes")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.notes && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Notes
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("nextReminder")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.nextReminder && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Next Reminder
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("reminderStatus")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.reminderStatus && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Reminder Status
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("price")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.price && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Price
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("createdBy")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
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
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.updatedBy && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Updated By
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("actions")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.actions && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Actions
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsVisitDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Add New Visit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="">
          {petData.visits && petData.visits.length > 0 ? (
            <Table>
              <TableCaption>Visit history for {petData.name}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Date</TableHead>
                  {visitColumnsVisibility.type && (
                    <TableHead className="font-medium">Type</TableHead>
                  )}
                  {visitColumnsVisibility.notes && (
                    <TableHead className="font-medium">Notes</TableHead>
                  )}
                  {visitColumnsVisibility.nextReminder && (
                    <TableHead className="font-medium">Next Reminder</TableHead>
                  )}
                  {visitColumnsVisibility.reminderStatus && (
                    <TableHead className="font-medium">Reminder</TableHead>
                  )}
                  {visitColumnsVisibility.price && (
                    <TableHead className="font-medium">Price</TableHead>
                  )}
                  {visitColumnsVisibility.createdBy && (
                    <TableHead className="font-medium">Created By</TableHead>
                  )}
                  {visitColumnsVisibility.updatedBy && (
                    <TableHead className="font-medium">Updated By</TableHead>
                  )}
                  {visitColumnsVisibility.actions && (
                    <TableHead className="text-right font-medium">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {petData.visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{formatDisplayDate(visit.visitDate)}</TableCell>
                    {visitColumnsVisibility.type && (
                      <TableCell className="text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-800"
                        >
                          {visit.visitType}
                        </Badge>
                      </TableCell>
                    )}
                    {visitColumnsVisibility.notes && (
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {visit.notes || "-"}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.nextReminder && (
                      <TableCell className="hidden md:table-cell">
                        {visit.nextReminderDate
                          ? formatDisplayDate(visit.nextReminderDate)
                          : "-"}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.reminderStatus && (
                      <TableCell>
                        {visit.isReminderEnabled ? (
                          <span className="flex items-center text-green-600">
                            <Bell className="h-4 w-4 mr-1" />
                            On
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-500">
                            <BellOff className="h-4 w-4 mr-1" />
                            Off
                          </span>
                        )}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.price && (
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(visit.price)}
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
                    {visitColumnsVisibility.actions && (
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
                              className="cursor-pointer"
                              inset={false}
                              onClick={() => {
                                setEditingVisit(visit);
                                setIsVisitEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Visit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              inset={false}
                              onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                setDeletingVisit(visit);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Visit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <p>No visits recorded for this pet.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setIsVisitDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Schedule First Visit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Pet Dialog */}
      <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
          </DialogHeader>
          {petData && (
            <PetForm
              initialData={{
                name: petData.name,
                species: petData.species,
                breed: petData.breed || "",
                birthDate: petData.birthDate
                  ? new Date(petData.birthDate)
                  : null,
                gender: petData.gender || "",
                ownerId: petData.owner.id,
                notes: petData.notes || "",
              }}
              onSubmit={handleUpdatePet}
              onClose={() => setIsPetDialogOpen(false)}
              isLoading={isUpdatingPet}
              owners={[]}
              ownerId={petData.owner.id} // Pass the ownerId to disable owner selection
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Visit Dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add New Visit</DialogTitle>
          </DialogHeader>
          {petData && (
            <VisitForm
              onSubmit={handleCreateVisit}
              onClose={() => setIsVisitDialogOpen(false)}
              isLoading={isCreatingVisit}
              selectedPetData={{
                owner: {
                  allowAutomatedReminders: true, // You may need to fetch this from the owner data
                },
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog
        open={isVisitEditDialogOpen}
        onOpenChange={setIsVisitEditDialogOpen}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Visit</DialogTitle>
          </DialogHeader>
          {editingVisit && (
            <VisitForm
              initialData={{
                id: editingVisit.id,
                visitDate: new Date(editingVisit.visitDate),
                visitType: editingVisit.visitType,
                notes: editingVisit.notes || undefined,
                isReminderEnabled: editingVisit.isReminderEnabled,
                nextReminderDate: editingVisit.nextReminderDate
                  ? new Date(editingVisit.nextReminderDate)
                  : undefined,
                price: editingVisit.price,
                pet: {
                  id: petId,
                  owner: {
                    allowAutomatedReminders: true, // You may need to fetch this from the owner data
                  },
                },
              }}
              onSubmit={handleUpdateVisit}
              onClose={() => {
                setIsVisitEditDialogOpen(false);
                setEditingVisit(null);
              }}
              isLoading={isUpdatingVisit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Visit Dialog */}
      <AlertDialog
        open={!!deletingVisit}
        onOpenChange={(open) => !open && setDeletingVisit(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this visit record for{" "}
              <span className="font-medium">{petData?.name}</span> on{" "}
              <span className="font-medium">
                {deletingVisit
                  ? formatDisplayDate(deletingVisit.visitDate)
                  : ""}
              </span>
              .
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
