import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDebounce } from "./use-debounce";

// Define interfaces
export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  allowAutomatedReminders: boolean;
  createdAt: string;
  address?: string;
  createdBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  updatedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface OwnerPaginatedResponse {
  data: Owner[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
}

// Constants
export const PAGE_SIZES = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[1]; // Default to 20

// Function to fetch owners from the backend
const fetchOwners = async (
  pageParam = 1,
  limitParam = DEFAULT_PAGE_SIZE,
  searchTerm?: string
): Promise<OwnerPaginatedResponse> => {
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

  // Log each API request for debugging
  console.log(`Fetching owners with params:`, params);
  
  const response = await axiosInstance.get("/owners", { params });
  return response.data;
};

export function useOwners() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // Add a ref to track if a refetch is in progress
  const isRefetching = useRef(false);
  
  // Get initial state from URL parameters or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialLimit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
  
  // State for pagination and search
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Function to create query string with all parameters
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const urlParams = new URLSearchParams();
      
      // Don't preserve existing parameters, start fresh
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Don't add limit to URL if it's the default value
          if (key === 'limit' && value === DEFAULT_PAGE_SIZE) {
            // Skip adding default limit
          } else {
            urlParams.set(key, value.toString());
          }
        }
      });
      
      return urlParams.toString();
    },
    []
  );
  
  // Function to clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setPage(1);
    setLimit(DEFAULT_PAGE_SIZE);
    
    // Immediately update the URL to the base path
    router.replace(pathname, { scroll: false });
    
    // Force a clean refetch
    isRefetching.current = true;
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      isRefetching.current = false;
    }, 0);
  }, [router, pathname, queryClient]);
  
  // Function to manually force a refresh with specific parameters
  const forceRefreshWithParams = useCallback((newPage: number, newLimit: number, newSearch: string) => {
    // Update local state
    setPage(newPage);
    setLimit(newLimit);
    setSearchTerm(newSearch);
    
    // Create URL parameters - use a more specific type that allows undefined values
    const params: Record<string, string | number | undefined> = {
      page: newPage === 1 ? undefined : newPage,
      limit: newLimit === DEFAULT_PAGE_SIZE ? undefined : newLimit, 
      search: newSearch || undefined,
    };
    
    // Filter out undefined values
    const cleanParams: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanParams[key] = value;
      }
    });
    
    // Update URL
    const queryString = createQueryString(cleanParams);
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    
    // Force refetch
    isRefetching.current = true;
    queryClient.removeQueries({ queryKey: ["owners"] });
    queryClient.invalidateQueries({ queryKey: ["owners"] });
    setTimeout(() => {
      isRefetching.current = false;
    }, 100);
  }, [createQueryString, pathname, router, queryClient]);
  
  // Function to set limit with URL update and forced refetch
  const setLimitWithRefresh = useCallback((newLimit: number) => {
    // Always reset to page 1 when changing limit
    forceRefreshWithParams(1, newLimit, searchTerm);
  }, [forceRefreshWithParams, searchTerm]);
  
  // Custom function to update page
  const setPageWithRefresh = useCallback((newPage: number) => {
    forceRefreshWithParams(newPage, limit, searchTerm);
  }, [forceRefreshWithParams, limit, searchTerm]);
  
  // Update URL when user navigates back/forward
  useEffect(() => {
    // Only run this effect if we're not already refetching
    if (isRefetching.current) return;
    
    const newPage = parseInt(searchParams.get("page") || "1", 10);
    const newSearch = searchParams.get("search") || "";
    const newLimit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);

    // Check if any values have really changed to avoid loops
    const hasChanged = newPage !== page || newSearch !== searchTerm || newLimit !== limit;
    
    if (hasChanged) {
      setPage(newPage);
      setSearchTerm(newSearch);
      setLimit(newLimit);
      
      // Force a refetch with the new URL parameters
      queryClient.invalidateQueries({ queryKey: ["owners", newPage, newLimit, newSearch] });
    }
  }, [searchParams, page, searchTerm, limit, queryClient]);
  
  // Query for fetching owners
  const {
    data: response,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["owners", page, limit, debouncedSearchTerm],
    queryFn: () => fetchOwners(page, limit, debouncedSearchTerm),
    staleTime: 0, // Always revalidate
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
  
  // Check if any filters are active
  const hasActiveFilters = debouncedSearchTerm;
  
  return {
    owners: response?.data || [],
    meta: response?.meta,
    isLoading,
    error,
    isError,
    searchTerm,
    setSearchTerm: (value: string) => forceRefreshWithParams(1, limit, value),
    page,
    setPage: setPageWithRefresh,
    limit,
    setLimit: setLimitWithRefresh,
    clearFilters,
    hasActiveFilters,
    refetch,
  };
} 