"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ClipboardList,
  Search,
  X,
  RefreshCcw,
  PawPrint,
  Users,
} from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
import { Badge } from "@/components/ui/badge";
import { PetForm, PetFormValues } from "@/components/forms/pet-form";
import { Input } from "@/components/ui/input";

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  initialFormData?: PetFormValues;
}

// Type definition for API error response
interface ErrorResponse {
  message: string;
}

// Function to fetch all owners
const fetchOwners = async (): Promise<Owner[]> => {
  const response = await axiosInstance.get("/owners");
  return response.data;
};

// Function to fetch all pets across all owners
const fetchAllPets = async (searchTerm?: string): Promise<Pet[]> => {
  const params: { search?: string } = { search: searchTerm || undefined };
  // Remove undefined params before sending
  Object.keys(params).forEach((key) => {
    if (params[key as keyof typeof params] === undefined) {
      delete params[key as keyof typeof params];
    }
  });

  // Use the direct pets endpoint with search capability
  const response = await axiosInstance.get("/pets", { params });
  return response.data;
};

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

export default function PetsPage() {
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  // Debounce search term to prevent too many requests
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Query for fetching all owners (needed for the pet form)
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: ["owners"],
    queryFn: fetchOwners,
  });

  // Query for fetching all pets
  const {
    data: pets,
    isLoading: isLoadingPets,
    error: petsError,
    isError: isPetsError,
  } = useQuery({
    queryKey: ["all-pets", debouncedSearchTerm],
    queryFn: () => fetchAllPets(debouncedSearchTerm),
  });

  // Function for creating a new pet
  const createPetFn = async (newPetData: PetFormValues) => {
    const { ownerId, ...petDetails } = newPetData;

    // Format date for API if it exists
    const formattedData = {
      ...petDetails,
      birthDate: petDetails.birthDate
        ? petDetails.birthDate.toISOString()
        : undefined,
    };

    const response = await axiosInstance.post(
      `/owners/${ownerId}/pets`,
      formattedData
    );
    return response.data;
  };

  const { mutate: createPet, isPending: isCreatingPet } = useMutation({
    mutationFn: createPetFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-pets"] });
      toast.success("Pet added successfully");
      setIsPetDialogOpen(false);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error creating pet:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create pet";
      toast.error(errorMessage);
    },
  });

  // Function for updating a pet
  const updatePetFn = async (data: {
    petId: string;
    ownerId: string;
    updateData: Partial<PetFormValues>;
  }) => {
    const { petId, ownerId, updateData } = data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ownerId: _, ...petDetails } = updateData;

    // Format date for API if it exists
    const formattedData = {
      ...petDetails,
      birthDate: petDetails.birthDate
        ? petDetails.birthDate instanceof Date
          ? petDetails.birthDate.toISOString()
          : petDetails.birthDate
        : undefined,
    };

    const response = await axiosInstance.patch(
      `/owners/${ownerId}/pets/${petId}`,
      formattedData
    );
    return response.data;
  };

  const { mutate: updatePet, isPending: isUpdatingPet } = useMutation({
    mutationFn: updatePetFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-pets"] });
      toast.success("Pet updated successfully");
      setIsEditDialogOpen(false);
      setEditingPet(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error updating pet:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update pet";
      toast.error(errorMessage);
    },
  });

  // Function for deleting a pet
  const deletePetFn = async (data: { petId: string; ownerId: string }) => {
    const { petId, ownerId } = data;
    const response = await axiosInstance.delete(
      `/owners/${ownerId}/pets/${petId}`
    );
    return response.data;
  };

  const { mutate: deletePet, isPending: isDeletingPet } = useMutation({
    mutationFn: deletePetFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-pets"] });
      toast.success("Pet deleted successfully");
      setDeletingPet(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error deleting pet:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete pet";
      toast.error(errorMessage);
      setDeletingPet(null);
    },
  });

  const handleCreatePet = (data: PetFormValues) => {
    createPet(data);
  };

  const handleEditClick = (pet: Pet) => {
    // Ensure pet has the required owner information
    if (!pet.owner || !pet.owner.id) {
      toast.error("Cannot edit pet: Missing owner information");
      return;
    }

    // Create a form-compatible initial data object
    const initialData: PetFormValues = {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      birthDate: pet.birthDate ? new Date(pet.birthDate) : null,
      gender: pet.gender || "",
      ownerId: pet.owner.id,
      notes: pet.notes || "",
    };

    // Set the editing pet with both API data and form data
    setEditingPet({
      ...pet,
      initialFormData: initialData,
    } as Pet & { initialFormData: PetFormValues });

    setIsEditDialogOpen(true);
  };

  const handleUpdatePet = (formData: PetFormValues) => {
    if (!editingPet || !editingPet.id || !editingPet.owner?.id) {
      toast.error("Cannot update pet: Missing required information");
      return;
    }

    updatePet({
      petId: editingPet.id,
      ownerId: formData.ownerId || editingPet.owner.id, // Use the potentially new owner ID from the form or fallback to current owner
      updateData: formData,
    });
  };

  const handleDeleteClick = (pet: Pet) => {
    setDeletingPet(pet);
  };

  const confirmDeletePet = () => {
    if (!deletingPet || !deletingPet.id || !deletingPet.owner?.id) {
      toast.error("Cannot delete pet: Missing required information");
      return;
    }

    deletePet({
      petId: deletingPet.id,
      ownerId: deletingPet.owner.id,
    });
  };

  const getSpeciesBadgeColor = (species: string) => {
    switch (species.toLowerCase()) {
      case "dog":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "cat":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "bird":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "rabbit":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Check if we can show the New Pet button
  const isNewPetButtonDisabled =
    isLoadingOwners || !owners || owners.length === 0;

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">All Pets</CardTitle>
          <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add Pet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-xl">Add New Pet</DialogTitle>
              </DialogHeader>
              <PetForm
                owners={owners}
                onSubmit={handleCreatePet}
                onClose={() => setIsPetDialogOpen(false)}
                isLoading={isCreatingPet || isLoadingOwners}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search input */}
          <div className="px-6 py-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search pets by name, species, owner..."
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

          {isLoadingPets ? (
            <div className="w-full overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Species</TableHead>
                    <TableHead className="font-medium">Breed</TableHead>
                    <TableHead className="font-medium">Owner</TableHead>
                    <TableHead className="text-center font-medium w-20">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : isPetsError ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                Error loading pets:{" "}
                {(petsError as Error)?.message || "Unknown error"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["pets"] })
                }
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : pets && pets.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm text-muted-foreground">
                A list of all registered pets.
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Species</TableHead>
                  <TableHead className="font-medium">Breed</TableHead>
                  <TableHead className="font-medium">Owner</TableHead>
                  <TableHead className="text-center font-medium w-20">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {pets.map((pet) => (
                  <TableRow key={pet.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link
                        href={`/pets/${pet.id}`}
                        className="text-primary hover:underline"
                      >
                        {pet.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={getSpeciesBadgeColor(pet.species)}
                      >
                        {pet.species}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {pet.breed}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {pet.owner
                        ? `${pet.owner.firstName} ${pet.owner.lastName}`
                        : "Unknown"}
                    </TableCell>
                    <TableCell className="text-center">
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
                        <DropdownMenuContent
                          align="end"
                          className="w-36"
                          sideOffset={4}
                        >
                          <DropdownMenuItem
                            onClick={() => handleEditClick(pet)}
                            className="cursor-pointer text-left"
                            inset={false}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer text-left"
                            inset={false}
                          >
                            <Link
                              href={`/pets/${pet.id}/visits`}
                              className="flex items-center w-full"
                            >
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Visits
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(pet)}
                            className="text-red-600 focus:text-red-600 cursor-pointer text-left"
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
            <div className="flex flex-col items-center justify-center py-12">
              <PawPrint className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? `No pets found matching "${searchTerm}"`
                  : isNewPetButtonDisabled
                  ? "No owners registered yet. Please add an owner first before adding pets."
                  : "No pets registered yet. Add your first pet to get started."}
              </p>
              {isNewPetButtonDisabled ? (
                <Button onClick={() => router.push("/owners")}>
                  <Users className="mr-2 h-4 w-4" />
                  Register an Owner First
                </Button>
              ) : (
                <Button onClick={() => setIsPetDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Pet
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Pet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold">Edit Pet</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the pet information
            </DialogDescription>
          </DialogHeader>
          {editingPet && owners && (
            <PetForm
              initialData={editingPet.initialFormData}
              onSubmit={handleUpdatePet}
              onClose={() => setIsEditDialogOpen(false)}
              owners={owners}
              isLoading={isUpdatingPet}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Pet Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPet}
        onOpenChange={(open) => !open && setDeletingPet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium">{deletingPet?.name}</span> from the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePet}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeletingPet}
            >
              {isDeletingPet ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
