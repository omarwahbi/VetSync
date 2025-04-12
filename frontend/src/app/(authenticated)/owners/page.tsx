"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";

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

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  allowAutomatedReminders: boolean;
  createdAt: string;
}

interface ErrorResponse {
  message: string;
}

// Function to fetch owners from the backend
const fetchOwners = async (): Promise<Owner[]> => {
  const response = await axiosInstance.get("/owners");
  return response.data;
};

export default function OwnersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [deletingOwner, setDeletingOwner] = useState<Owner | null>(null);
  const queryClient = useQueryClient();

  // Query for fetching owners
  const {
    data: owners,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["owners"],
    queryFn: fetchOwners,
  });

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

  const handleCreateOwner = (data: OwnerFormValues) => {
    createOwner(data);
  };

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
    <div className="space-y-4">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Manage Owners</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
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
                onSubmit={handleCreateOwner}
                onClose={() => setIsDialogOpen(false)}
                isLoading={isCreating}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="sr-only">Loading owners...</span>
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                Error loading owners: {(error as Error).message}
              </p>
            </div>
          ) : owners && owners.length > 0 ? (
            <Table className="w-full">
              <TableCaption className="text-sm text-muted-foreground">
                A list of all registered pet owners.
              </TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium">First Name</TableHead>
                  <TableHead className="font-medium">Last Name</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Phone</TableHead>
                  <TableHead className="font-medium">Reminders</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {owners.map((owner) => (
                  <TableRow key={owner.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {owner.firstName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {owner.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {owner.email || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {owner.phone}
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
                            onClick={() => handleEditClick(owner)}
                            className="cursor-pointer"
                            inset={false}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(owner)}
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
              <p className="text-muted-foreground">No owners found.</p>
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
              initialData={editingOwner}
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
              This will permanently delete {deletingOwner?.firstName}{" "}
              {deletingOwner?.lastName} from your records. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOwner}
              className="bg-red-600 hover:bg-red-700"
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
    </div>
  );
}
