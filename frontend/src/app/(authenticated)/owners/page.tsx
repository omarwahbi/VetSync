"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  X,
  Eye,
  MessageSquare,
  RefreshCcw,
  Users,
  Filter,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useDebounce } from "@/lib/hooks/useDebounce";
import Link from "next/link";
import { formatPhoneNumberForWhatsApp } from "@/lib/phoneUtils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button";
import { OwnerForm, OwnerFormValues } from "@/components/forms/owner-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NewClientWizard } from "@/components/wizards/new-client-wizard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  allowAutomatedReminders: boolean;
  createdAt: string;
  address?: string;
}

interface PaginatedResponse {
  data: Owner[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
}

interface ErrorResponse {
  message: string;
}

// Function to fetch owners from the backend
const fetchOwners = async (
  pageParam = 1,
  searchTerm?: string
): Promise<PaginatedResponse> => {
  const params: { page?: number; limit?: number; search?: string } = {
    page: pageParam,
    limit: 10,
    search: searchTerm || undefined,
  };

  // Remove undefined params before sending
  Object.keys(params).forEach((key) => {
    if (params[key as keyof typeof params] === undefined) {
      delete params[key as keyof typeof params];
    }
  });

  const response = await axiosInstance.get("/owners", { params });
  return response.data;
};

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

export default function OwnersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [deletingOwner, setDeletingOwner] = useState<Owner | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Debounce search term to prevent too many requests
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Function to clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = debouncedSearchTerm;

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Query for fetching owners
  const {
    data: response,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["owners", page, debouncedSearchTerm],
    queryFn: () => fetchOwners(page, debouncedSearchTerm),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract data and metadata
  const owners = response?.data || [];
  const meta = response?.meta;

  // Mutation for creating a new owner
  const createOwnerFn = async (newOwnerData: OwnerFormValues) => {
    const response = await axiosInstance.post("/owners", newOwnerData);
    return response.data;
  };

  const { mutate: createOwner, isPending: isCreating } = useMutation({
    mutationFn: createOwnerFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast.success("Owner added successfully");
      setIsDialogOpen(false);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || "Failed to add owner";
      toast.error(errorMessage);
    },
  });

  // Mutation for updating an owner
  const updateOwnerFn = async (data: {
    id: string;
    updateData: OwnerFormValues;
  }) => {
    const { id, updateData } = data;

    // Create a clean copy of the update data
    const processedData = {
      ...updateData,
      // Ensure email is null if empty string
      email: updateData.email === "" ? null : updateData.email,
    };

    const response = await axiosInstance.patch(`/owners/${id}`, processedData);
    return response.data;
  };

  const { mutate: updateOwner, isPending: isUpdatingOwner } = useMutation({
    mutationFn: updateOwnerFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast.success("Owner updated successfully");
      setIsEditDialogOpen(false);
      setEditingOwner(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error updating owner:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update owner";
      toast.error(errorMessage);
    },
  });

  // Mutation for deleting an owner
  const deleteOwnerFn = async (ownerId: string) => {
    const response = await axiosInstance.delete(`/owners/${ownerId}`);
    return response.data;
  };

  const { mutate: deleteOwner, isPending: isDeletingOwner } = useMutation({
    mutationFn: deleteOwnerFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast.success("Owner deleted successfully");
      setDeletingOwner(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error deleting owner:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete owner";
      toast.error(errorMessage);
      setDeletingOwner(null);
    },
  });

  const handleUpdateOwner = (data: OwnerFormValues) => {
    if (!editingOwner) {
      toast.error("Cannot update owner: Missing owner information");
      return;
    }
    updateOwner({
      id: editingOwner.id,
      updateData: data,
    });
  };

  const handleEditClick = (owner: Owner) => {
    // Make a copy of the owner data with proper handling for null/undefined values
    const ownerForEditing = {
      ...owner,
      email: owner.email || null, // Ensure null instead of undefined for empty email
    };
    setEditingOwner(ownerForEditing);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (owner: Owner) => {
    setDeletingOwner(owner);
  };

  const confirmDeleteOwner = () => {
    if (!deletingOwner) {
      toast.error("Cannot delete owner: Missing owner information");
      return;
    }
    deleteOwner(deletingOwner.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pet Owners</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all registered pet owners
        </p>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Manage Owners</CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  New Owner
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-xl">Add New Owner</DialogTitle>
                </DialogHeader>
                <OwnerForm
                  onSubmit={(data) => createOwner(data)}
                  onClose={() => setIsDialogOpen(false)}
                  isLoading={isCreating}
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
                placeholder="Search owners..."
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

            {hasActiveFilters && (
              <div className="flex items-center mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  Clear all filters
                </Button>
                <div className="ml-4 text-sm text-muted-foreground">
                  {meta?.totalCount !== undefined && (
                    <span>
                      {meta.totalCount}{" "}
                      {meta.totalCount === 1 ? "owner" : "owners"} found
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="w-full overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="font-medium">First Name</TableHead>
                    <TableHead className="font-medium">Last Name</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Phone</TableHead>
                    <TableHead className="font-medium">Reminders</TableHead>
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
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                Error loading owners:{" "}
                {(error as Error)?.message || "Unknown error"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["owners"] })
                }
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : owners && owners.length > 0 ? (
            <>
              <Table className="w-full">
                <TableCaption className="text-sm text-muted-foreground">
                  Showing page {meta?.currentPage} of {meta?.totalPages} (
                  {meta?.totalCount} total owners)
                </TableCaption>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="font-medium">First Name</TableHead>
                    <TableHead className="font-medium">Last Name</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Phone</TableHead>
                    <TableHead className="font-medium">Reminders</TableHead>
                    <TableHead className="text-center font-medium w-20">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {owners.map((owner: Owner) => {
                    const whatsappNumber = formatPhoneNumberForWhatsApp(
                      owner.phone
                    );

                    return (
                      <TableRow key={owner.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link
                            href={`/owners/${owner.id}`}
                            className="text-primary hover:underline"
                          >
                            {owner.firstName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {owner.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {owner.email || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{owner.phone}</span>
                            {whatsappNumber && (
                              <a
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700"
                                title={`Chat with ${owner.firstName} on WhatsApp`}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {owner.allowAutomatedReminders ? (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800"
                            >
                              Enabled
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800"
                            >
                              Disabled
                            </Badge>
                          )}
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
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                asChild
                                className="cursor-pointer text-left"
                                inset={false}
                              >
                                <Link href={`/owners/${owner.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClick(owner)}
                                className="cursor-pointer text-left"
                                inset={false}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(owner)}
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
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {meta && meta.totalPages > 1 && (
                <div className="px-6 py-6 border-t">
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-muted-foreground mb-3">
                      Page {meta.currentPage} of {meta.totalPages} (
                      {meta.totalCount} total owners)
                    </div>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage((p) => Math.max(1, p - 1));
                            }}
                            aria-disabled={meta.currentPage <= 1}
                            className={
                              meta.currentPage <= 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>

                        {/* Generate page numbers */}
                        {Array.from({
                          length: Math.min(5, meta.totalPages),
                        }).map((_, i) => {
                          // Logic to show pages around current page
                          let pageNum;
                          if (meta.totalPages <= 5) {
                            // If 5 or fewer pages, show all page numbers
                            pageNum = i + 1;
                          } else if (meta.currentPage <= 3) {
                            // If near the start, show first 5 pages
                            pageNum = i + 1;
                          } else if (meta.currentPage >= meta.totalPages - 2) {
                            // If near the end, show last 5 pages
                            pageNum = meta.totalPages - 4 + i;
                          } else {
                            // Otherwise show current page and 2 pages before and after
                            pageNum = meta.currentPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                isActive={pageNum === meta.currentPage}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(pageNum);
                                }}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage((p) => Math.min(meta.totalPages, p + 1));
                            }}
                            aria-disabled={meta.currentPage >= meta.totalPages}
                            className={
                              meta.currentPage >= meta.totalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters
                  ? "No owners found matching your filters. Try adjusting or clearing your filters."
                  : "No owners registered yet. Add your first client to get started."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              ) : (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register New Owner
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Owner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">Edit Owner</DialogTitle>
          </DialogHeader>
          {editingOwner && (
            <OwnerForm
              initialData={{
                firstName: editingOwner.firstName,
                lastName: editingOwner.lastName,
                phone: editingOwner.phone,
                email: editingOwner.email || undefined,
                address: editingOwner.address || undefined,
                allowAutomatedReminders: editingOwner.allowAutomatedReminders,
              }}
              onSubmit={handleUpdateOwner}
              onClose={() => setIsEditDialogOpen(false)}
              isLoading={isUpdatingOwner}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingOwner}
        onOpenChange={(open) => !open && setDeletingOwner(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the owner and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingOwner}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOwner}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeletingOwner}
            >
              {isDeletingOwner ? (
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

      <NewClientWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
}
