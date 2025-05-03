"use client";

import React from "react";
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
  Calendar,
  Filter,
  SlidersHorizontal,
  PlusCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PetForm, PetFormValues } from "@/components/forms/pet-form";
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { Input } from "@/components/ui/input";
import { SimplePagination } from "@/components/owners/SimplePagination";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// Replace the old ActionsMenu component with this new implementation
interface ActionsMenuProps {
  pet: Pet;
  locale: string;
  t: (key: string) => string;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  onAddVisit: (pet: Pet) => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({
  pet,
  locale,
  t,
  onEdit,
  onDelete,
  onAddVisit,
}) => {
  const params = useParams();
  const isRTL = params.locale === "ar";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          aria-label={t("openMenu")}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">{t("openMenu")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36"
        sideOffset={5}
        collisionPadding={10}
        forceMount
      >
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-start"
          inset={false}
        >
          <Link
            href={`/${locale}/pets/${pet.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ClipboardList className={`${isRTL ? "ms-2" : "me-2"} h-4 w-4`} />
            {t("viewDetails")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-start"
          inset={false}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddVisit(pet);
          }}
        >
          <Calendar className={`${isRTL ? "ms-2" : "me-2"} h-4 w-4`} />
          {t("addVisit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-start"
          inset={false}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(pet);
          }}
        >
          <Edit className={`${isRTL ? "ms-2" : "me-2"} h-4 w-4`} />
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer text-start"
          inset={false}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(pet);
          }}
        >
          <Trash2 className={`${isRTL ? "ms-2" : "me-2"} h-4 w-4`} />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function PetsClient() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("Pets");

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
  const { data: ownersResponse } = useQuery({
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
      toast.success(t("petCreatedSuccess"));
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        t("unknownError");
      toast.error(`${t("failedToCreatePet")} ${errorMessage}`);
      throw error;
    }
  };

  const { mutate: createPet, isPending: isCreatingPet } = useMutation({
    mutationFn: createPetFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success(t("petCreatedSuccess"));
      setIsPetDialogOpen(false);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error creating pet:", error);
      const errorMessage =
        error.response?.data?.message || t("failedToCreatePet");
      toast.error(`${t("failedToCreatePet")} ${errorMessage}`);
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
      toast.success(t("petUpdatedSuccess"));
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        t("unknownError");
      toast.error(`${t("failedToUpdatePet")} ${errorMessage}`);
      throw error;
    }
  };

  const { mutate: updatePet, isPending: isUpdatingPet } = useMutation({
    mutationFn: updatePetFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success(t("petUpdatedSuccess"));
      setIsEditDialogOpen(false);
      setEditingPet(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error updating pet:", error);
      const errorMessage =
        error.response?.data?.message || t("failedToUpdatePet");
      toast.error(`${t("failedToUpdatePet")} ${errorMessage}`);
    },
  });

  // Function for deleting a pet
  const deletePetFn = async (data: { petId: string; ownerId: string }) => {
    try {
      const { petId, ownerId } = data;
      const response = await axiosInstance.delete(
        `/owners/${ownerId}/pets/${petId}`
      );
      toast.success(t("petDeletedSuccess"));
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        t("unknownError");
      toast.error(`${t("failedToDeletePet")} ${errorMessage}`);
      throw error;
    }
  };

  const { mutate: deletePet, isPending: isDeletingPet } = useMutation({
    mutationFn: deletePetFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success(t("petDeletedSuccess"));
      setDeletingPet(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error deleting pet:", error);
      const errorMessage =
        error.response?.data?.message || t("failedToDeletePet");
      toast.error(`${t("failedToDeletePet")} ${errorMessage}`);
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
      toast.success(t("visitCreatedSuccess"));
      return response.data;
    } catch (error) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>).response?.data?.message ||
        (error as Error).message ||
        t("unknownError");
      toast.error(`${t("failedToCreateVisit")} ${errorMessage}`);
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
      toast.success(t("visitCreatedSuccess"));
      setIsVisitDialogOpen(false);
      setSelectedPetForVisit(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error creating visit:", error);
      const errorMessage =
        error.response?.data?.message || t("failedToCreateVisit");
      toast.error(`${t("failedToCreateVisit")} ${errorMessage}`);
    },
  });

  const handleCreatePet = (data: PetFormValues) => {
    createPet(data);
  };

  const handleEditClick = (pet: Pet) => {
    // Ensure pet has the required owner information
    if (!pet.owner || !pet.owner.id) {
      toast.error(t("cannotEditPetMissingOwner"));
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
      toast.error(t("cannotUpdatePetMissingInfo"));
      return;
    }

    // Prepare update data with owner ID
    const ownerId = formData.ownerId || editingPet.owner.id;

    // Submit update request
    updatePet({
      petId: editingPet.id,
      ownerId: ownerId,
      updateData: formData,
    });
  };

  const handleDeleteClick = (pet: Pet) => {
    setDeletingPet(pet);
  };

  const confirmDeletePet = () => {
    if (!deletingPet || !deletingPet.id || !deletingPet.owner?.id) {
      toast.error(t("cannotDeletePetMissingInfo"));
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
      toast.error(t("cannotCreateVisitNoPet"));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{t("petList")}</CardTitle>
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
              {t("viewDetails")}
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsPetDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("addNewPet")}
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
                placeholder={t("searchPets")}
                className="ps-10 w-full bg-white dark:bg-muted focus-visible:ring-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground hover:text-foregr
ound transition"
                  aria-label={t("cancel")}
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
                  {t("activeFilter")}
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
                    {t("clearFilters")}
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
                {t("error")}: {(error as Error)?.message || t("unknownError")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCcw className="me-2 h-4 w-4" />
                {t("retry")}
              </Button>
            </div>
          ) : pets && pets.length > 0 ? (
            // Pets table
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {petColumnsVisibility.name && (
                      <TableHead>{t("name")}</TableHead>
                    )}
                    {petColumnsVisibility.species && (
                      <TableHead>{t("species")}</TableHead>
                    )}
                    {petColumnsVisibility.breed && (
                      <TableHead>{t("breed")}</TableHead>
                    )}
                    {petColumnsVisibility.owner && (
                      <TableHead>{t("owner")}</TableHead>
                    )}
                    {petColumnsVisibility.createdBy && (
                      <TableHead>{t("createdBy")}</TableHead>
                    )}
                    {petColumnsVisibility.updatedBy && (
                      <TableHead>{t("updatedBy")}</TableHead>
                    )}
                    {petColumnsVisibility.actions && (
                      <TableHead className="text-end">{t("actions")}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pets.map((pet) => (
                    <TableRow key={pet.id}>
                      {petColumnsVisibility.name && (
                        <TableCell className="font-medium">
                          <Link
                            href={`/${locale}/pets/${pet.id}`}
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
                              href={`/${locale}/owners/${pet.owner.id}`}
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
                          <ActionsMenu
                            pet={pet}
                            locale={locale}
                            t={t}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onAddVisit={handleAddVisit}
                          />
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
              <h3 className="mb-1 text-lg font-medium">{t("noPetsFound")}</h3>
              <Button
                onClick={() => setIsPetDialogOpen(true)}
                className="mt-3"
                size="sm"
              >
                <PlusCircle className="me-2 h-4 w-4" />
                {t("addNewPet")}
              </Button>
            </div>
          )}

          {/* Pagination Controls with Page Size Selector */}
          {meta && meta.totalPages > 0 && (
            <div className="px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <p className="text-sm font-medium">{t("rowsPerPage")}</p>
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
            <DialogTitle>{t("addNewPet")}</DialogTitle>
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
            <DialogTitle>{t("editPet")}</DialogTitle>
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
            <AlertDialogTitle>{t("deletePet")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeletePet")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePet}
              disabled={isDeletingPet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPet ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("pleaseWait")}
                </>
              ) : (
                t("delete")
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
              {t("addVisit")}
              {selectedPetForVisit && `: ${selectedPetForVisit.name}`}
            </DialogTitle>
          </DialogHeader>
          {selectedPetForVisit && (
            <VisitForm
              onSubmit={(data) => {
                handleCreateVisit(data);
              }}
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
