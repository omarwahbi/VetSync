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
  PlusCircle,
  Loader2,
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
    try {
      const response = await axiosInstance.post(
        `/owners/${newPetData.ownerId}/pets`,
        newPetData
      );
      toast.success("Pet created successfully");
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        "An error occurred";
      toast.error(`Failed to create pet. ${errorMessage}`);
      throw error;
    }
  };

  const { mutate: createPet, isPending: isCreatingPet } = useMutation({
    mutationFn: createPetFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet created successfully");
      setIsPetDialogOpen(false);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error creating pet:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create pet";
      toast.error(`Failed to create pet. ${errorMessage}`);
    },
  });

  // Function for updating a pet
  const updatePetFn = async (data: {
    petId: string;
    ownerId: string;
    updateData: Partial<PetFormValues>;
  }) => {
    try {
      const { petId, ownerId, updateData } = data;
      const response = await axiosInstance.patch(
        `/owners/${ownerId}/pets/${petId}`,
        updateData
      );
      toast.success("Pet updated successfully");
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        "An error occurred";
      toast.error(`Failed to update pet. ${errorMessage}`);
      throw error;
    }
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
      toast.error(`Failed to update pet. ${errorMessage}`);
    },
  });

  // Function for deleting a pet
  const deletePetFn = async (data: { petId: string; ownerId: string }) => {
    try {
      const { petId, ownerId } = data;
      const response = await axiosInstance.delete(
        `/owners/${ownerId}/pets/${petId}`
      );
      toast.success("Pet deleted successfully");
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        "An error occurred";
      toast.error(`Failed to delete pet. ${errorMessage}`);
      throw error;
    }
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
      toast.error(`Failed to delete pet. ${errorMessage}`);
      setDeletingPet(null);
    },
  });

  // Function for creating a new visit
  const createVisitFn = async (data: {
    petId: string;
    visitData: VisitFormValues;
  }) => {
    try {
      const { petId, visitData } = data;

      // Format dates for API
      const formattedData = {
        ...visitData,
        visitDate: visitData.visitDate.toISOString(),
        nextReminderDate: visitData.nextReminderDate
          ? visitData.nextReminderDate.toISOString()
          : null,
      };

      const response = await axiosInstance.post(
        `/pets/${petId}/visits`,
        formattedData
      );
      toast.success("Visit created successfully");
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        "An error occurred";
      toast.error(`Failed to create visit. ${errorMessage}`);
      throw error;
    }
  };

  const { mutate: createVisit, isPending: isCreatingVisit } = useMutation({
    mutationFn: createVisitFn,
    onSuccess: () => {
      if (selectedPetForVisit) {
        queryClient.invalidateQueries({
          queryKey: ["visits", selectedPetForVisit.id],
        });
      }
      toast.success("Visit created successfully");
      setIsVisitDialogOpen(false);
      setSelectedPetForVisit(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error creating visit:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create visit";
      toast.error(`Failed to create visit. ${errorMessage}`);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pets</h1>
        <p className="text-muted-foreground mt-2">
          Manage your pets efficiently
        </p>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Pets List</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => {
                setPetColumnsVisibility((prev) => ({
                  ...prev,
                  createdBy: !prev.createdBy,
                  updatedBy: !prev.updatedBy,
                }));
              }}
            >
              <SlidersHorizontal className="me-2 h-4 w-4" />
              View Details
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsPetDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Pet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search input */}
          <div className="px-6 py-4 border-b bg-muted/40">
            <div className="relative">
              <Search className="absolute top-1/2 start-3 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pets"
                className="ps-10 w-full bg-white dark:bg-muted focus-visible:ring-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Filter chips */}
            {(statusFilter !== "ALL" ||
              speciesFilter !== "ALL" ||
              sexFilter !== "ALL" ||
              searchTerm) && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md flex items-center">
                  <Filter className="me-1 h-3 w-3" />
                  Active Filter
                </div>
                {(statusFilter !== "ALL" ||
                  speciesFilter !== "ALL" ||
                  sexFilter !== "ALL" ||
                  searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("ALL");
                      setSpeciesFilter("ALL");
                      setSexFilter("ALL");
                      // Reset URL params
                      const newParams = createQueryString({
                        search: null,
                        status: null,
                        species: null,
                        sex: null,
                        page: 1,
                      });
                      router.replace(`${pathname}?${newParams}`);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            // Loading state UI
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : isError ? (
            // Error state UI
            <div className="py-8 text-center">
              <p className="text-red-500">
                Error: {(error as Error)?.message || "An error occurred"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCcw className="me-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : pets && pets.length > 0 ? (
            // Pets table
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {petColumnsVisibility.name && <TableHead>Name</TableHead>}
                    {petColumnsVisibility.species && (
                      <TableHead>Species</TableHead>
                    )}
                    {petColumnsVisibility.breed && <TableHead>Breed</TableHead>}
                    {petColumnsVisibility.owner && <TableHead>Owner</TableHead>}
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
                  {pets.map((pet) => (
                    <TableRow key={pet.id}>
                      {petColumnsVisibility.name && (
                        <TableCell className="font-medium">
                          <Link
                            href={`/pets/${pet.id}`}
                            className="hover:underline text-primary"
                          >
                            {pet.name}
                          </Link>
                        </TableCell>
                      )}
                      {petColumnsVisibility.species && (
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getSpeciesBadgeColor(pet.species)}
                          >
                            {pet.species}
                          </Badge>
                        </TableCell>
                      )}
                      {petColumnsVisibility.breed && (
                        <TableCell>{pet.breed || "-"}</TableCell>
                      )}
                      {petColumnsVisibility.owner && (
                        <TableCell>
                          {pet.owner ? (
                            <Link
                              href={`/owners/${pet.owner.id}`}
                              className="hover:underline text-primary"
                            >
                              {pet.owner.firstName} {pet.owner.lastName}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </TableCell>
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
                                aria-label="View Details"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/pets/${pet.id}`}
                                  className="flex items-center gap-2"
                                >
                                  <ClipboardList className="h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAddVisit(pet)}
                              >
                                <Calendar className="me-2 h-4 w-4" />
                                Add Visit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClick(pet)}
                              >
                                <Edit className="me-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(pet)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="me-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Empty state UI
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
                <PlusCircle className="me-2 h-4 w-4" />
                Add New Pet
              </Button>
            </div>
          )}

          {/* Pagination Controls with Page Size Selector */}
          {meta && meta.totalPages > 0 && (
            <div className="px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${limit}`}
                    onValueChange={(value: string) => {
                      setLimit(Number(value));
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
                  totalPages={Math.ceil((meta?.totalCount ?? 0) / limit)}
                  totalCount={meta?.totalCount ?? 0}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Pet Dialog */}
      <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
          </DialogHeader>
          <PetForm
            onSubmit={handleCreatePet}
            onClose={() => setIsPetDialogOpen(false)}
            isLoading={isCreatingPet}
            owners={owners}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Pet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
          </DialogHeader>
          {editingPet && (
            <PetForm
              initialData={{
                name: editingPet.name,
                species: editingPet.species,
                breed: editingPet.breed || "",
                birthDate: editingPet.birthDate
                  ? new Date(editingPet.birthDate)
                  : null,
                gender: editingPet.gender || "",
                notes: editingPet.notes || "",
                ownerId: editingPet.ownerId,
              }}
              onSubmit={handleUpdatePet}
              onClose={() => {
                setIsEditDialogOpen(false);
                setEditingPet(null);
              }}
              isLoading={isUpdatingPet}
              owners={owners}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Pet Confirmation */}
      <AlertDialog
        open={!!deletingPet}
        onOpenChange={() => setDeletingPet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pet?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePet}
              disabled={isDeletingPet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPet ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  Please Wait
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Visit Dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Add Visit
              {selectedPetForVisit && `: ${selectedPetForVisit.name}`}
            </DialogTitle>
          </DialogHeader>
          {selectedPetForVisit && (
            <VisitForm
              petId={selectedPetForVisit.id}
              onSubmit={handleCreateVisit}
              onClose={() => {
                setIsVisitDialogOpen(false);
                setSelectedPetForVisit(null);
              }}
              isLoading={isCreatingVisit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
