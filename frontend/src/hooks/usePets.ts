import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

// Pet interface 
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  createdAt: string;
}

// Function to fetch pets by owner ID
const fetchPetsByOwnerId = async (ownerId: string): Promise<{ data: Pet[] }> => {
  const response = await axiosInstance.get(`/owners/${ownerId}/pets`);
  return response.data;
};

// Hook to get pets by owner ID
export function usePetsByOwner(ownerId: string | null | undefined) {
  const {
    data: response,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["ownerPets", ownerId],
    queryFn: () => fetchPetsByOwnerId(ownerId as string),
    enabled: !!ownerId, // Only run if ownerId is provided
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    pets: response?.data || [],
    isLoading,
    error,
    isError,
    refetch,
  };
} 