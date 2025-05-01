"use client";

import { useState, useEffect, useCallback } from "react";
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
  Calendar,
  Filter,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { Input } from "@/components/ui/input";
import { SimplePagination } from "@/components/owners/SimplePagination";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  allowAutomatedReminders?: boolean;
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
  createdAt?: string;
  updatedAt?: string;
  createdBy?: User;
  updatedBy?: User;
}

// Paginated response interface
interface PaginatedResponse {
  data: Pet[];
  meta: {
    totalCount: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
  };
}

// Type definition for API error response
interface ErrorResponse {
  message: string;
}

// Constants
const PAGE_SIZES = [10, 20, 50, 100];

// Function to fetch all owners
interface OwnersResponse {
  data: Owner[];
  meta: {
    totalCount: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
  };
}

const fetchOwners = async (): Promise<OwnersResponse> => {
  const response = await axiosInstance.get("/owners");
  return response.data;
};

// Function to fetch all pets across all owners
const fetchAllPets = async (
  pageParam = 1,
  limitParam = 20,
  searchTerm?: string
): Promise<PaginatedResponse> => {
  const params: { page?: number; limit?: number; search?: string } = {
    page: pageParam,
    limit: limitParam,
    search: searchTerm || undefined,
  };

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial state from URL parameters or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialStatusFilter = searchParams.get("status") || "ALL";
  const initialSpeciesFilter = searchParams.get("species") || "ALL";
  const initialSexFilter = searchParams.get("sex") || "ALL";
  const initialLimit = parseInt(
    searchParams.get("limit") || String(PAGE_SIZES[1]),
    10
  ); // Default to 20

  // State using URL values as initial values
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [selectedPetForVisit, setSelectedPetForVisit] = useState<Pet | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [speciesFilter, setSpeciesFilter] =
    useState<string>(initialSpeciesFilter);
  const [sexFilter, setSexFilter] = useState<string>(initialSexFilter);

  // Column visibility state
  const [petColumnsVisibility, setPetColumnsVisibility] = useState({
    name: true,
    species: true,
    breed: true,
    owner: true,
    createdBy: false,
    updatedBy: false,
    actions: true,
  });

  const queryClient = useQueryClient();

  // Function to toggle column visibility
  const toggleColumn = (column: keyof typeof petColumnsVisibility) => {
    setPetColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Debounce search term to prevent too many requests
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Function to create query string with all parameters
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const urlParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          urlParams.delete(key);
        } else {
          // Don't add limit to URL if it's the default value (20)
          if (key === "limit" && value === PAGE_SIZES[1]) {
            urlParams.delete("limit");
          } else {
            urlParams.set(key, value.toString());
          }
        }
      });

      return urlParams.toString();
    },
    [searchParams]
  );

  // Update URL when filters change
  useEffect(() => {
    const params: Record<string, string | number | null> = {
      // Always include page in the URL, don't use null value for page=1
      page: page,
      search: searchTerm || null,
      status: statusFilter === "ALL" ? null : statusFilter,
      species: speciesFilter === "ALL" ? null : speciesFilter,
      sex: sexFilter === "ALL" ? null : sexFilter,
      limit: limit === PAGE_SIZES[1] ? null : limit,
    };

    const queryString = createQueryString(params);
    // Use replace instead of push to avoid caching issues
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [
    page,
    searchTerm,
    statusFilter,
    speciesFilter,
    sexFilter,
    limit,
    router,
    pathname,
    createQueryString,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, speciesFilter, sexFilter, limit]);

  // Query for fetching all owners (needed for the pet form)
  const { data: ownersResponse, isLoading: isLoadingOwners } = useQuery({
    queryKey: ["owners"],
    queryFn: fetchOwners,
    enabled: isPetDialogOpen || isEditDialogOpen, // Only fetch when adding/editing a pet
  });

  // Extract owners array from response
  const owners = ownersResponse?.data || [];

  // Fetch pets data with React Query
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "pets",
      page,
      limit,
      debouncedSearchTerm,
      statusFilter,
      speciesFilter,
      sexFilter,
    ],
    queryFn: () => fetchAllPets(page, limit, debouncedSearchTerm || undefined),
  });

  // Extract pets and metadata
  const pets = data?.data || [];
  const meta = data?.meta;

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
      queryClient.invalidateQueries({ queryKey: ["pets"] });
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
      queryClient.invalidateQueries({ queryKey: ["pets"] });
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
      queryClient.invalidateQueries({ queryKey: ["pets"] });
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

  // Function for creating a new visit
  const createVisitFn = async (data: {
    petId: string;
    visitData: VisitFormValues;
  }) => {
    const { petId, visitData } = data;

    // Format dates for API
    const formattedData = {
      ...visitData,
      visitDate: visitData.visitDate.toISOString(),
      nextReminderDate: visitData.nextReminderDate
        ? visitData.nextReminderDate.toISOString()
        : null,
      price: visitData.price,
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
      if (selectedPetForVisit) {
        queryClient.invalidateQueries({
          queryKey: ["visits", selectedPetForVisit.id],
        });
      }
      toast.success("Visit added successfully");
      setIsVisitDialogOpen(false);
      setSelectedPetForVisit(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error creating visit:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create visit";
      toast.error(errorMessage);
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

  const handleAddVisit = (pet: Pet) => {
    setSelectedPetForVisit(pet);
    setIsVisitDialogOpen(true);
  };

  const handleCreateVisit = (visitData: VisitFormValues) => {
    if (!selectedPetForVisit) {
      toast.error("Cannot create visit: No pet selected");
      return;
    }

    createVisit({
      petId: selectedPetForVisit.id,
      visitData,
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
          <div className="flex items-center gap-2">
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
                  onClick={() => toggleColumn("name")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {petColumnsVisibility.name && <Check className="h-3 w-3" />}
                  </div>
                  Name
                </DropdownMenuItem>
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
                  onClick={() => toggleColumn("owner")}
                  inset={false}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {petColumnsVisibility.owner && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  Owner
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
            <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add Pet
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-md max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
              >
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
          </div>
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
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

            {statusFilter !== "ALL" ||
              speciesFilter !== "ALL" ||
              (sexFilter !== "ALL" && (
                <div className="flex items-center mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setSpeciesFilter("ALL");
                      setSexFilter("ALL");
                      setPage(1);
                    }}
                    className="text-muted-foreground"
                  >
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    Clear all filters
                  </Button>
                  <div className="ml-4 text-sm text-muted-foreground">
                    {meta?.totalCount !== undefined && (
                      <span>
                        {meta.totalCount}{" "}
                        {meta.totalCount === 1 ? "pet" : "pets"} found
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {isLoading ? (
            <div className="w-full overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    {petColumnsVisibility.name && (
                      <TableHead className="font-medium">Name</TableHead>
                    )}
                    {petColumnsVisibility.species && (
                      <TableHead className="font-medium">Species</TableHead>
                    )}
                    {petColumnsVisibility.breed && (
                      <TableHead className="font-medium">Breed</TableHead>
                    )}
                    {petColumnsVisibility.owner && (
                      <TableHead className="font-medium">Owner</TableHead>
                    )}
                    {petColumnsVisibility.createdBy && (
                      <TableHead className="font-medium">Created By</TableHead>
                    )}
                    {petColumnsVisibility.updatedBy && (
                      <TableHead className="font-medium">Updated By</TableHead>
                    )}
                    {petColumnsVisibility.actions && (
                      <TableHead className="text-center font-medium w-48">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      {petColumnsVisibility.name && (
                        <TableCell className="font-medium">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      )}
                      {petColumnsVisibility.species && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                      )}
                      {petColumnsVisibility.breed && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}
                      {petColumnsVisibility.owner && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                      )}
                      {petColumnsVisibility.createdBy && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                      )}
                      {petColumnsVisibility.updatedBy && (
                        <TableCell className="text-muted-foreground">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                      )}
                      {petColumnsVisibility.actions && (
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                Error loading pets:{" "}
                {(error as Error)?.message || "Unknown error"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : pets && pets.length > 0 ? (
            <>
              <Table className="w-full">
                <TableCaption className="text-sm text-muted-foreground">
                  Showing page {meta?.currentPage} of {meta?.totalPages} (
                  {meta?.totalCount} total pets)
                </TableCaption>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    {petColumnsVisibility.name && (
                      <TableHead className="font-medium">Name</TableHead>
                    )}
                    {petColumnsVisibility.species && (
                      <TableHead className="font-medium">Species</TableHead>
                    )}
                    {petColumnsVisibility.breed && (
                      <TableHead className="font-medium">Breed</TableHead>
                    )}
                    {petColumnsVisibility.owner && (
                      <TableHead className="font-medium">Owner</TableHead>
                    )}
                    {petColumnsVisibility.createdBy && (
                      <TableHead className="font-medium">Created By</TableHead>
                    )}
                    {petColumnsVisibility.updatedBy && (
                      <TableHead className="font-medium">Updated By</TableHead>
                    )}
                    {petColumnsVisibility.actions && (
                      <TableHead className="text-center font-medium w-48">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {pets.map((pet) => (
                    <TableRow key={pet.id} className="hover:bg-muted/50">
                      {petColumnsVisibility.name && (
                        <TableCell className="font-medium">
                          <Link
                            href={`/pets/${pet.id}`}
                            className="text-primary hover:underline"
                          >
                            {pet.name}
                          </Link>
                        </TableCell>
                      )}
                      {petColumnsVisibility.species && (
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={getSpeciesBadgeColor(pet.species)}
                          >
                            {pet.species}
                          </Badge>
                        </TableCell>
                      )}
                      {petColumnsVisibility.breed && (
                        <TableCell className="text-muted-foreground">
                          {pet.breed}
                        </TableCell>
                      )}
                      {petColumnsVisibility.owner && (
                        <TableCell className="text-muted-foreground">
                          {pet.owner
                            ? `${pet.owner.firstName} ${pet.owner.lastName}`
                            : "Unknown"}
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
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddVisit(pet)}
                              className="mr-1"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Add Visit
                            </Button>
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
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {data?.meta && data.meta.totalPages > 0 && (
                <div className="px-6 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Rows per page</p>
                      <Select
                        value={`${limit}`}
                        onValueChange={(value: string) => {
                          const newLimit = Number(value);
                          setLimit(newLimit);
                          setPage(1); // Reset page when limit changes

                          // Update URL immediately to bypass Next.js streaming cache issues
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );

                          // Always set page explicitly to 1
                          params.set("page", "1");

                          // Update limit parameter
                          if (newLimit === PAGE_SIZES[1]) {
                            params.delete("limit");
                          } else {
                            params.set("limit", newLimit.toString());
                          }

                          router.replace(`${pathname}?${params.toString()}`, {
                            scroll: false,
                          });

                          // Force React Query to refetch with the new limit
                          queryClient.invalidateQueries({ queryKey: ["pets"] });
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={limit} />
                        </SelectTrigger>
                        <SelectContent side="top" className="">
                          {PAGE_SIZES.map((pageSize) => (
                            <SelectItem
                              key={pageSize}
                              value={`${pageSize}`}
                              className=""
                            >
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <SimplePagination
                      currentPage={page}
                      totalPages={Math.ceil(
                        (data?.meta?.totalCount ?? 0) / limit
                      )}
                      totalCount={data?.meta?.totalCount ?? 0}
                      onPageChange={(newPage) => {
                        setPage(newPage);

                        // Update URL with new page
                        const urlParams = new URLSearchParams(
                          searchParams.toString()
                        );
                        urlParams.set("page", newPage.toString());

                        // Use replace to avoid caching issues
                        router.replace(`${pathname}?${urlParams.toString()}`, {
                          scroll: false,
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <PawPrint className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">
                {statusFilter !== "ALL" ||
                speciesFilter !== "ALL" ||
                sexFilter !== "ALL"
                  ? "No pets found matching your filters. Try adjusting or clearing your filters."
                  : isNewPetButtonDisabled
                  ? "No owners registered yet. Please add an owner first before adding pets."
                  : "No pets registered yet. Add your first pet to get started."}
              </p>
              {statusFilter !== "ALL" ||
              speciesFilter !== "ALL" ||
              sexFilter !== "ALL" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSpeciesFilter("ALL");
                    setSexFilter("ALL");
                    setPage(1);
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              ) : isNewPetButtonDisabled ? (
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
        <DialogContent
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
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

      {/* Add Visit Dialog */}
      <Dialog
        open={isVisitDialogOpen}
        onOpenChange={(open) => !open && setIsVisitDialogOpen(false)}
      >
        <DialogContent
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold">
              Add New Visit
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedPetForVisit
                ? `Record a visit for ${selectedPetForVisit.name}`
                : "Record a new visit"}
            </DialogDescription>
          </DialogHeader>
          <VisitForm
            onSubmit={handleCreateVisit}
            onClose={() => {
              setIsVisitDialogOpen(false);
              setSelectedPetForVisit(null);
            }}
            isLoading={isCreatingVisit}
            selectedPetData={{
              owner: selectedPetForVisit?.owner
                ? {
                    allowAutomatedReminders:
                      selectedPetForVisit.owner.allowAutomatedReminders ?? true,
                  }
                : { allowAutomatedReminders: true },
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
