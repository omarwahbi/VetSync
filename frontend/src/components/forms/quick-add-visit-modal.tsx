"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, PlusCircle } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { PetForm, PetFormValues } from "@/components/forms/pet-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    allowAutomatedReminders?: boolean;
  };
}

interface QuickAddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddVisitModal({
  isOpen,
  onClose,
}: QuickAddVisitModalProps) {
  const queryClient = useQueryClient();
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedPetData, setSelectedPetData] = useState<Pet | null>(null);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [showAddPetDialog, setShowAddPetDialog] = useState(false);

  // Get auth token for checking authentication status
  const accessToken = useAuthStore((state) => state.accessToken);

  // Log auth status
  useEffect(() => {
    console.log(
      "Authentication status:",
      accessToken ? "Authenticated" : "Not authenticated"
    );
  }, [accessToken]);

  // Fetch owners query
  const {
    data: ownersData,
    isLoading: isLoadingOwners,
    error: ownersError,
    refetch: refetchOwners,
  } = useQuery({
    queryKey: ["owners"],
    queryFn: async () => {
      console.log(
        "Fetching owners with token:",
        accessToken ? "Present" : "Missing"
      );
      if (!accessToken) {
        console.warn("No access token available for API call");
        return [];
      }

      try {
        // Use original endpoint
        const response = await axiosInstance.get("/owners");
        console.log("Owners API response:", response);

        if (!response.data) {
          console.warn("Empty response data from owners API");
          return [];
        }

        // Extract the array from data property if it exists
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(
            "Found owners array in data property:",
            response.data.data.length
          );
          return response.data.data as Owner[];
        }

        // Fallback if the expected structure is not found
        return Array.isArray(response.data) ? (response.data as Owner[]) : [];
      } catch (error: unknown) {
        console.error("Error fetching owners:", error);
        // If unauthorized, this likely means the authentication token needs to be refreshed
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          console.log("Authentication error, might need to refresh token");
          // Token refresh should be handled by axios interceptor
        }
        return [];
      }
    },
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: 1000, // Wait 1 second between retries
    enabled: isOpen && !!accessToken, // Only run when modal is open and user is authenticated
    refetchOnWindowFocus: false,
  });

  // Ensure owners is always an array
  const owners = Array.isArray(ownersData) ? ownersData : [];

  // Filter owners based on search query
  const filteredOwners = owners.filter((owner) => {
    const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
    return fullName.includes(ownerSearchQuery.toLowerCase());
  });

  // Debug logs
  useEffect(() => {
    console.log("ownersData:", ownersData);
    console.log("owners array:", owners);
    console.log("isLoadingOwners:", isLoadingOwners);
    console.log("ownersError:", ownersError);

    // If no owners data but the modal is open, try to refetch
    if (isOpen && (!owners || owners.length === 0) && !isLoadingOwners) {
      console.log("No owners data, triggering refetch...");
      setTimeout(() => {
        refetchOwners();
      }, 1000);
    }
  }, [ownersData, isLoadingOwners, ownersError, isOpen, owners, refetchOwners]);

  // Fetch pets for selected owner (only when an owner is selected)
  const {
    data: petsData,
    isLoading: isLoadingPets,
    error: petsError,
  } = useQuery({
    queryKey: ["pets", selectedOwnerId],
    queryFn: async () => {
      if (!selectedOwnerId) return [];
      if (!accessToken) {
        console.warn("No access token available for pets API call");
        return [];
      }

      console.log("Fetching pets for owner:", selectedOwnerId);
      try {
        const response = await axiosInstance.get(
          `/owners/${selectedOwnerId}/pets`
        );
        console.log("Pets API response:", response);

        if (!response.data) {
          console.warn("Empty response data from pets API");
          return [];
        }

        // Extract the array from data property if it exists
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(
            "Found pets array in data property:",
            response.data.data.length
          );
          return response.data.data as Pet[];
        }

        // Fallback if the expected structure is not found
        return Array.isArray(response.data) ? (response.data as Pet[]) : [];
      } catch (error: unknown) {
        console.error("Error fetching pets:", error);
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          console.log("Authentication error, might need to refresh token");
        }
        return [];
      }
    },
    enabled: !!selectedOwnerId && !!accessToken,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Ensure pets is always an array
  const pets = Array.isArray(petsData) ? petsData : [];

  // Debug logs for pets data
  useEffect(() => {
    console.log("petsData:", petsData);
    console.log("pets array:", pets);
    console.log("isLoadingPets:", isLoadingPets);
    console.log("petsError:", petsError);
  }, [petsData, isLoadingPets, petsError, pets]);

  // Create visit mutation
  const { mutate: createVisit, isPending: isCreatingVisit } = useMutation({
    mutationFn: async (data: VisitFormValues) => {
      if (!selectedPetId) throw new Error("Pet ID is required");
      const response = await axiosInstance.post(
        `/pets/${selectedPetId}/visits`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingVisits"] });
      if (selectedPetId) {
        queryClient.invalidateQueries({ queryKey: ["visits", selectedPetId] });
        queryClient.invalidateQueries({ queryKey: ["pet", selectedPetId] });
      }

      // Show success message and reset
      toast.success("Visit created successfully!");
      handleReset();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create visit: ${error.message}`);
    },
  });

  // Add Pet mutation
  const { mutate: createPet, isPending: isCreatingPet } = useMutation({
    mutationFn: async (data: PetFormValues) => {
      if (!selectedOwnerId) throw new Error("Owner ID is required");
      const response = await axiosInstance.post(
        `/owners/${selectedOwnerId}/pets`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pets", selectedOwnerId] });

      // Show success message
      toast.success("Pet added successfully!");

      // Close the add pet dialog
      setShowAddPetDialog(false);

      // If we have pet data returned, select it automatically
      if (data && data.id) {
        // Refetch pets to make sure we have the latest data
        queryClient
          .refetchQueries({ queryKey: ["pets", selectedOwnerId] })
          .then(() => {
            // A small delay to ensure the UI updates with the new pet data
            setTimeout(() => {
              handleSelectPet(data.id);
            }, 300);
          });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to add pet: ${error.message}`);
    },
  });

  const handleReset = () => {
    setSelectedOwnerId(null);
    setSelectedPetId(null);
    setSelectedPetData(null);
    setOwnerSearchQuery("");
    onClose();
  };

  const handleCreateVisit = (data: VisitFormValues) => {
    createVisit(data);
  };

  const handleSelectOwner = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setSelectedPetId(null);
    setSelectedPetData(null);
  };

  const handleSelectPet = (petId: string) => {
    console.log("Pet selection attempted for ID:", petId);
    console.log("Available pets:", pets);

    // Find the pet data from selected ID
    const petData = pets.find((pet) => pet.id === petId);
    console.log("Found pet data:", petData);

    if (petData) {
      setSelectedPetId(petId);
      setSelectedPetData(petData);

      // Log whether owner data exists
      if (petData.owner) {
        console.log("Pet has owner data:", petData.owner);
      } else {
        console.warn("Pet is missing owner data, this might cause issues");
      }
    } else {
      console.error("Could not find pet with ID:", petId);
    }
  };

  const handleAddPet = (data: PetFormValues) => {
    createPet(data);
  };

  // Log when component renders
  useEffect(() => {
    if (isOpen) {
      console.log("QuickAddVisitModal opened, owners length:", owners.length);
    }
  }, [isOpen, owners.length]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add New Visit</DialogTitle>
          <DialogDescription>
            Select owner, pet, and fill in visit details to create a new visit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Owner Selection */}
          <div className="space-y-2">
            <Label htmlFor="owner-select" className="text-sm font-medium">
              Select Owner
            </Label>
            <Select
              value={selectedOwnerId || ""}
              onValueChange={handleSelectOwner}
              disabled={isLoadingOwners || owners.length === 0}
            >
              <SelectTrigger className="w-full" id="owner-select">
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <div className="flex items-center border-b px-3 py-2">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search owners..."
                    className="h-8 border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={ownerSearchQuery}
                    onChange={(e) => setOwnerSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredOwners.length > 0 ? (
                    filteredOwners.map((owner) => (
                      <SelectItem
                        key={owner.id}
                        value={owner.id}
                        className="cursor-pointer"
                      >
                        {owner.firstName} {owner.lastName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No owners found
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Pet Selection (only when owner is selected) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pet-select" className="text-sm font-medium">
                Select Pet
              </Label>
              {selectedOwnerId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-primary"
                  onClick={() => setShowAddPetDialog(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Pet</span>
                </Button>
              )}
            </div>
            <Select
              value={selectedPetId || ""}
              onValueChange={handleSelectPet}
              disabled={!selectedOwnerId || isLoadingPets || pets.length === 0}
            >
              <SelectTrigger className="w-full" id="pet-select">
                <SelectValue placeholder="Select a pet" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {isLoadingPets ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    <span>Loading pets...</span>
                  </div>
                ) : pets.length > 0 ? (
                  pets.map((pet) => (
                    <SelectItem
                      key={pet.id}
                      value={pet.id}
                      className="cursor-pointer"
                    >
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No pets found for this owner
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Visit Form (only when pet is selected) */}
          {selectedPetId && selectedPetData && (
            <div className="pt-4">
              <VisitForm
                selectedPetData={{
                  owner: {
                    allowAutomatedReminders:
                      selectedPetData.owner?.allowAutomatedReminders,
                  },
                }}
                quickAdd={true}
                initialData={{
                  petId: selectedPetId,
                  pet: {
                    id: selectedPetId,
                    name: selectedPetData.name,
                    owner: {
                      id: selectedPetData.owner?.id || "",
                      allowAutomatedReminders:
                        selectedPetData.owner?.allowAutomatedReminders,
                    },
                  },
                  visitDate: new Date(),
                  visitType: "",
                  notes: "",
                  isReminderEnabled: true,
                }}
                onSubmit={handleCreateVisit}
                onClose={handleReset}
                isLoading={isCreatingVisit}
              />
            </div>
          )}
        </div>
      </DialogContent>

      {/* Add Pet Dialog */}
      {selectedOwnerId && (
        <Dialog open={showAddPetDialog} onOpenChange={setShowAddPetDialog}>
          <DialogContent
            className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Add New Pet</DialogTitle>
              <DialogDescription>
                Add a new pet for this owner
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <PetForm
                owners={[]} // Not needed since we're using the selectedOwnerId
                ownerId={selectedOwnerId}
                onSubmit={handleAddPet}
                onClose={() => setShowAddPetDialog(false)}
                isLoading={isCreatingPet}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
