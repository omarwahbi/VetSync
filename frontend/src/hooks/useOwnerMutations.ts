import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";

// Types for form values and responses
export interface OwnerFormValues {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  address?: string;
  allowAutomatedReminders: boolean;
}

interface ErrorResponse {
  message: string;
}

export function useOwnerMutations() {
  const queryClient = useQueryClient();

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
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error("Error deleting owner:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete owner";
      toast.error(errorMessage);
    },
  });

  return {
    createOwner,
    isCreating,
    updateOwner,
    isUpdatingOwner,
    deleteOwner,
    isDeletingOwner,
  };
} 