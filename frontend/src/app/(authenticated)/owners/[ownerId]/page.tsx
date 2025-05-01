"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  User,
  Phone,
  Mail,
  PawPrint,
  PlusCircle,
  ChevronLeft,
  Edit,
  MoreHorizontal,
  Eye,
  Trash2,
  MessageSquare,
  MapPin,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatPhoneNumberForWhatsApp } from "@/lib/phoneUtils";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";

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
import { OwnerForm } from "@/components/forms/owner-form";
import { PetForm } from "@/components/forms/pet-form";

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
  address?: string | null;
  allowAutomatedReminders: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: User;
  updatedBy?: User;
  pets?: Pet[];
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birthDate: string | null;
  createdBy?: User;
  updatedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

interface OwnerFormValues {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  allowAutomatedReminders: boolean;
}

interface PetFormValues {
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birthDate?: Date | null;
  ownerId?: string;
  notes?: string;
}

// Function to fetch owner details with their pets
const fetchOwnerDetails = async (ownerId: string): Promise<Owner> => {
  const response = await axiosInstance.get(`/owners/${ownerId}`);
  return response.data;
};

export default function OwnerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const ownerId = params.ownerId as string;
  const queryClient = useQueryClient();

  // Dialog states
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Column visibility state - simplified
  const [petColumnsVisibility, setPetColumnsVisibility] = useState({
    name: true,
    species: true,
    breed: true,
    gender: true,
    createdBy: false,
    updatedBy: false,
    actions: true,
  });

  const {
    data: ownerData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["owner", ownerId],
    queryFn: () => fetchOwnerDetails(ownerId),
    enabled: !!ownerId,
  });

  // Update owner mutation
  const { mutate: updateOwner, isPending: isUpdatingOwner } = useMutation({
    mutationFn: async (formData: OwnerFormValues) => {
      const response = await axiosInstance.patch(
        `/owners/${ownerId}`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      setIsOwnerDialogOpen(false);
      toast.success("Owner updated successfully");
    },
    onError: (error: AxiosError) => {
      toast.error(`Error updating owner: ${error.message || "Unknown error"}`);
    },
  });

  // Create pet mutation
  const { mutate: createPet, isPending: isCreatingPet } = useMutation({
    mutationFn: async (formData: PetFormValues) => {
      const response = await axiosInstance.post(
        `/owners/${ownerId}/pets`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      // Also invalidate pets list if you have a global pets query
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      setIsPetDialogOpen(false);
      toast.success("Pet created successfully");
    },
    onError: (error: AxiosError) => {
      toast.error(`Error creating pet: ${error.message || "Unknown error"}`);
    },
  });

  // Delete owner mutation
  const { mutate: deleteOwner, isPending: isDeletingOwner } = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/owners/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast.success("Owner deleted successfully");
      router.push("/owners");
    },
    onError: (error: AxiosError) => {
      toast.error(`Error deleting owner: ${error.message || "Unknown error"}`);
    },
  });

  const handleUpdateOwner = (formData: OwnerFormValues) => {
    updateOwner(formData);
  };

  const handleCreatePet = (formData: PetFormValues) => {
    createPet({ ...formData, ownerId });
  };

  const handleDeleteOwner = () => {
    deleteOwner(ownerId);
  };

  // Toggle column visibility
  const toggleColumn = (column: keyof typeof petColumnsVisibility) => {
    setPetColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/owners">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Owners
            </Link>
          </Button>
        </div>

        <Card className="bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Owner Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                <Skeleton className="h-5 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Pets</CardTitle>
          </CardHeader>
          <CardContent className="">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !ownerData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/owners">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Owners
            </Link>
          </Button>
        </div>

        <Card className="bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Owner Details</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="text-red-500">
              Error loading owner details:{" "}
              {(error as Error)?.message || "Could not load owner data"}
            </div>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/owners">Return to Owners List</Link>
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
          <Link href="/owners">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Owners
          </Link>
        </Button>
      </div>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Owner Details</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsOwnerDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Owner
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
                  Delete Owner
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="space-y-2">
                  <AlertDialogTitle className="text-xl">
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This action cannot be undone. This will permanently delete
                    owner{" "}
                    <span className="font-medium">
                      {ownerData?.firstName} {ownerData?.lastName}
                    </span>{" "}
                    and all associated pets and visits.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteOwner}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeletingOwner}
                  >
                    {isDeletingOwner ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="font-medium">
                {ownerData.firstName} {ownerData.lastName}
              </span>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">
                {ownerData.email || "No email provided"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{ownerData.phone}</span>
              {formatPhoneNumberForWhatsApp(ownerData.phone) && (
                <a
                  href={`https://wa.me/${formatPhoneNumberForWhatsApp(
                    ownerData.phone
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700"
                  title={`Chat with ${ownerData.firstName} on WhatsApp`}
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="flex items-start">
              <MapPin className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">
                {ownerData.address || "No address provided"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Automated Reminders:</span>
              {ownerData.allowAutomatedReminders ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Disabled
                </Badge>
              )}
            </div>

            {/* Audit Information */}
            <div className="text-xs text-muted-foreground mt-4">
              <p>Created: {formatDisplayDateTime(ownerData.createdAt)}</p>
              {ownerData.updatedAt &&
                ownerData.updatedAt !== ownerData.createdAt && (
                  <p>
                    Last updated: {formatDisplayDateTime(ownerData.updatedAt)}
                  </p>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <PawPrint className="h-5 w-5 mr-2 text-muted-foreground" />
            Pets
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
                  onClick={() => toggleColumn("species")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {petColumnsVisibility.species && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Species
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("breed")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {petColumnsVisibility.breed && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Breed
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("gender")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {petColumnsVisibility.gender && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Gender
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("createdBy")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {petColumnsVisibility.createdBy && (
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
                    {petColumnsVisibility.updatedBy && (
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
                    {petColumnsVisibility.actions && (
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
              onClick={() => setIsPetDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Add New Pet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="">
          {ownerData.pets && ownerData.pets.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm">
                List of pets owned by {ownerData.firstName} {ownerData.lastName}
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium">Name</TableHead>
                  {petColumnsVisibility.species && (
                    <TableHead className="font-medium">Species</TableHead>
                  )}
                  {petColumnsVisibility.breed && (
                    <TableHead className="font-medium">Breed</TableHead>
                  )}
                  {petColumnsVisibility.gender && (
                    <TableHead className="font-medium">Gender</TableHead>
                  )}
                  {petColumnsVisibility.createdBy && (
                    <TableHead className="font-medium">Created By</TableHead>
                  )}
                  {petColumnsVisibility.updatedBy && (
                    <TableHead className="font-medium">Updated By</TableHead>
                  )}
                  {petColumnsVisibility.actions && (
                    <TableHead className="text-right font-medium">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {ownerData.pets.map((pet) => (
                  <TableRow key={pet.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link
                        href={`/pets/${pet.id}`}
                        className="text-primary hover:underline"
                      >
                        {pet.name}
                      </Link>
                    </TableCell>
                    {petColumnsVisibility.species && (
                      <TableCell className="text-muted-foreground">
                        {pet.species}
                      </TableCell>
                    )}
                    {petColumnsVisibility.breed && (
                      <TableCell className="text-muted-foreground">
                        {pet.breed || "-"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.gender && (
                      <TableCell className="text-muted-foreground">
                        {pet.gender
                          ? pet.gender.charAt(0).toUpperCase() +
                            pet.gender.slice(1)
                          : "-"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.createdBy && (
                      <TableCell className="text-muted-foreground">
                        {pet.createdBy
                          ? `${pet.createdBy.firstName || ""} ${
                              pet.createdBy.lastName || ""
                            }`.trim() || "Unknown"
                          : "System"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.updatedBy && (
                      <TableCell className="text-muted-foreground">
                        {pet.updatedBy
                          ? `${pet.updatedBy.firstName || ""} ${
                              pet.updatedBy.lastName || ""
                            }`.trim() || "Unknown"
                          : "System"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.actions && (
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
                              asChild
                              className="cursor-pointer"
                              inset={false}
                            >
                              <Link
                                href={`/pets/${pet.id}`}
                                className="flex items-center"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              inset={false}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer"
                              inset={false}
                            >
                              <Link
                                href={`/pets/${pet.id}/visits`}
                                className="flex items-center"
                              >
                                <PawPrint className="mr-2 h-4 w-4" />
                                Visits
                              </Link>
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
              <PawPrint className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <p>No pets registered for this owner.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setIsPetDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Pet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Owner Dialog */}
      <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Owner</DialogTitle>
          </DialogHeader>
          {ownerData && (
            <OwnerForm
              initialData={{
                firstName: ownerData.firstName,
                lastName: ownerData.lastName,
                phone: ownerData.phone,
                email: ownerData.email === null ? undefined : ownerData.email,
                address:
                  ownerData.address === null ? undefined : ownerData.address,
                allowAutomatedReminders: ownerData.allowAutomatedReminders,
              }}
              onSubmit={handleUpdateOwner}
              onClose={() => setIsOwnerDialogOpen(false)}
              isLoading={isUpdatingOwner}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Pet Dialog */}
      <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
          </DialogHeader>
          <PetForm
            onSubmit={handleCreatePet}
            onClose={() => setIsPetDialogOpen(false)}
            isLoading={isCreatingPet}
            owners={[]}
            ownerId={ownerId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
