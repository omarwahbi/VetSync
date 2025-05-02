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
  Bell,
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
      toast.error(
        `Failed to update owner: ${error.message || "An error occurred"}`
      );
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
      toast.error(
        `Error creating pet: ${error.message || "An error occurred"}`
      );
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
      toast.error(
        `Failed to delete owner: ${error.message || "An error occurred"}`
      );
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
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" asChild>
            <Link href="/owners">
              <ChevronLeft className="h-4 w-4 me-1" />
              Back to Owners
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-7 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/owners">
            <ChevronLeft className="h-4 w-4 me-1" />
            Back to Owners
          </Link>
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              An error occurred
            </h2>
            <p className="text-muted-foreground mb-4">
              {(error as AxiosError)?.message || "An error occurred"}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const owner = ownerData;
  if (!owner) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" asChild>
            <Link href="/owners">
              <ChevronLeft className="h-4 w-4 me-1" />
              Back to Owners
            </Link>
          </Button>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsOwnerDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4 me-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4 me-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Owner</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this owner? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOwner}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingOwner ? "Please wait..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Owner Details Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {owner.firstName} {owner.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Contact Details */}
              <div className="grid gap-2">
                {/* Email */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">Email</p>
                    {owner.email ? (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {owner.email}
                        </p>
                        <a
                          href={`mailto:${owner.email}`}
                          className="inline-flex h-6 items-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          Send Email
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">Phone</p>
                    {owner.phone ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          {owner.phone}
                        </p>
                        <div className="flex gap-1 text-xs">
                          <a
                            href={`tel:${owner.phone}`}
                            className="inline-flex h-6 items-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${formatPhoneNumberForWhatsApp(
                              owner.phone
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-6 items-center rounded-md bg-green-600 px-2 text-xs font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            Send WhatsApp
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">Address</p>
                    {owner.address ? (
                      <p className="text-sm text-muted-foreground">
                        {owner.address}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Automated Reminders */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">Automated Reminders</p>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          owner.allowAutomatedReminders ? "default" : "outline"
                        }
                        className="flex items-center gap-1 text-xs"
                      >
                        {owner.allowAutomatedReminders && (
                          <Check className="h-3 w-3" />
                        )}
                        {owner.allowAutomatedReminders ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                {owner.createdBy && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Created By
                    </p>
                    <p>
                      {owner.createdBy.firstName} {owner.createdBy.lastName}
                    </p>
                  </div>
                )}
                {owner.createdAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Created At
                    </p>
                    <p>{formatDisplayDateTime(owner.createdAt)}</p>
                  </div>
                )}
                {owner.updatedBy && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Updated By
                    </p>
                    <p>
                      {owner.updatedBy.firstName} {owner.updatedBy.lastName}
                    </p>
                  </div>
                )}
                {owner.updatedAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Updated At
                    </p>
                    <p>{formatDisplayDateTime(owner.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">View Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button
                className="w-full flex items-center justify-start gap-2"
                onClick={() => setIsPetDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Add Pet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pets Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Pets</CardTitle>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => {
                setPetColumnsVisibility((prev) => ({
                  ...prev,
                  createdBy: !prev.createdBy,
                  updatedBy: !prev.updatedBy,
                }));
              }}
            >
              <SlidersHorizontal className="h-4 w-4 me-1" />
              View Details
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsPetDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 me-1" />
              Add Pet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {owner.pets && owner.pets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Species</TableHead>
                  {petColumnsVisibility.breed && <TableHead>Breed</TableHead>}
                  {petColumnsVisibility.gender && <TableHead>Gender</TableHead>}
                  {petColumnsVisibility.createdBy && (
                    <TableHead>Created By</TableHead>
                  )}
                  {petColumnsVisibility.updatedBy && (
                    <TableHead>Updated By</TableHead>
                  )}
                  {petColumnsVisibility.actions && (
                    <TableHead className="text-end">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {owner.pets.map((pet) => (
                  <TableRow key={pet.id}>
                    <TableCell className="font-medium">{pet.name}</TableCell>
                    <TableCell>{pet.species}</TableCell>
                    {petColumnsVisibility.breed && (
                      <TableCell>{pet.breed || "-"}</TableCell>
                    )}
                    {petColumnsVisibility.gender && (
                      <TableCell>{pet.gender || "-"}</TableCell>
                    )}
                    {petColumnsVisibility.createdBy && (
                      <TableCell>
                        {pet.createdBy
                          ? `${pet.createdBy.firstName} ${pet.createdBy.lastName}`
                          : "-"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.updatedBy && (
                      <TableCell>
                        {pet.updatedBy
                          ? `${pet.updatedBy.firstName} ${pet.updatedBy.lastName}`
                          : "-"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.actions && (
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Open menu"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/pets/${pet.id}`}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Pet Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Pet
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <div className="flex items-center gap-2 text-red-500">
                                <Trash2 className="h-4 w-4" />
                                Delete Pet
                              </div>
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <PawPrint className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-medium">No pets found</h3>
              <Button
                onClick={() => setIsPetDialogOpen(true)}
                className="mt-3"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 me-2" />
                Add Pet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Owner Dialog */}
      <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Owner</DialogTitle>
          </DialogHeader>
          <OwnerForm
            initialData={{
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email,
              phone: owner.phone,
              address: owner.address,
              allowAutomatedReminders: owner.allowAutomatedReminders,
            }}
            onSubmit={handleUpdateOwner}
            onClose={() => setIsOwnerDialogOpen(false)}
            isLoading={isUpdatingOwner}
          />
        </DialogContent>
      </Dialog>

      {/* Add Pet Dialog */}
      <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Pet</DialogTitle>
          </DialogHeader>
          <PetForm
            onSubmit={handleCreatePet}
            onClose={() => setIsPetDialogOpen(false)}
            isLoading={isCreatingPet}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
