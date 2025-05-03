import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { Owner } from "./useOwners";

// Function to fetch a specific owner by ID
const fetchOwnerById = async (ownerId: string): Promise<{ data: Owner }> => {
  const response = await axiosInstance.get(`/owners/${ownerId}`);
  return response.data;
};

// Hook to get owner by ID
export function useOwner(ownerId: string) {
  const {
    data: response,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["owner", ownerId],
    queryFn: () => fetchOwnerById(ownerId),
    enabled: !!ownerId, // Only run if ownerId is provided
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    owner: response?.data,
    isLoading,
    error,
    isError,
    refetch,
  };
} 