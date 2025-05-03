"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/auth";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { PetForm, PetFormValues } from "@/components/forms/pet-form";

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
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

function QuickAddVisitModalContent({
  isOpen,
  onClose,
}: QuickAddVisitModalProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("QuickAddVisit");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedPetData, setSelectedPetData] = useState<Pet | null>(null);
  const [selectedOwnerName, setSelectedOwnerName] = useState<string>("");

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
      setShowPetForm(false);

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
    setSelectedOwnerName("");
    onClose();
  };

  const handleCreateVisit = (data: VisitFormValues) => {
    createVisit(data);
  };

  const handleSelectOwner = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setSelectedPetId(null);
    setSelectedPetData(null);

    // Set the owner name for display
    const owner = owners.find((o) => o.id === ownerId);
    if (owner) {
      setSelectedOwnerName(
        `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
      );
    }
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

  const [showPetForm, setShowPetForm] = useState(false);

  const handleShowPetForm = () => {
    setShowPetForm(true);
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
        dir="auto"
      >
        <DialogHeader>
          <DialogTitle className="text-start">{t("title")}</DialogTitle>
          <DialogDescription className="text-start">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Owner Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="owner-select"
              className="text-sm font-medium text-start block"
            >
              {t("selectOwner")}
            </Label>
            <Select
              value={selectedOwnerId || ""}
              onValueChange={handleSelectOwner}
              disabled={isLoadingOwners || owners.length === 0}
            >
              <SelectTrigger className="w-full text-start" id="owner-select">
                <SelectValue placeholder={t("selectOwner")} />
              </SelectTrigger>
              <SelectContent className="w-full">
                {isLoadingOwners ? (
                  <div className="flex items-center gap-2 p-2 rtl:space-x-reverse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("loadingOwners")}</span>
                  </div>
                ) : owners.length === 0 ? (
                  <div className="p-2 text-center text-sm">{t("noOwners")}</div>
                ) : (
                  owners.map((owner) => (
                    <SelectItem
                      key={owner.id}
                      value={owner.id}
                      className="cursor-pointer text-start"
                    >
                      {`${owner.firstName || ""} ${owner.lastName || ""} (${
                        owner.phone
                      })`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Pet Selection */}
          {selectedOwnerId && (
            <div className="space-y-2">
              <Label
                htmlFor="pet-select"
                className="text-sm font-medium text-start block"
              >
                {t("selectPet")}
              </Label>
              <p className="text-sm text-muted-foreground text-start">
                {t("petFor", { name: selectedOwnerName })}
              </p>
              <Select
                value={selectedPetId || ""}
                onValueChange={handleSelectPet}
                disabled={isLoadingPets || pets.length === 0}
              >
                <SelectTrigger className="w-full text-start" id="pet-select">
                  <SelectValue placeholder={t("selectPet")} />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {isLoadingPets ? (
                    <div className="flex items-center gap-2 p-2 rtl:space-x-reverse">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("loadingPets")}</span>
                    </div>
                  ) : pets.length === 0 ? (
                    <div className="p-2 text-center text-sm">{t("noPets")}</div>
                  ) : (
                    pets.map((pet) => (
                      <SelectItem
                        key={pet.id}
                        value={pet.id}
                        className="cursor-pointer text-start"
                      >
                        {pet.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={handleShowPetForm}
              >
                <PlusCircle className="me-2 h-4 w-4" />
                {t("addNewPet")}
              </Button>
            </div>
          )}

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
      {showPetForm && selectedOwnerId && (
        <Dialog open={true} onOpenChange={() => setShowPetForm(false)}>
          <DialogContent
            className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
            dir="auto"
          >
            <DialogHeader>
              <DialogTitle className="text-start">{t("addNewPet")}</DialogTitle>
            </DialogHeader>
            <PetForm
              onSubmit={createPet}
              onClose={() => setShowPetForm(false)}
              isLoading={isCreatingPet}
              ownerId={selectedOwnerId}
              owners={[]}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

export function QuickAddVisitModal({
  isOpen,
  onClose,
}: QuickAddVisitModalProps) {
  const params = useParams();
  const locale = params.locale as string;

  // Validate the locale (defaults to 'en' if missing)
  const validLocale = locale || "en";

  // Get messages directly based on locale
  const messages = validLocale === "ar" ? arMessages : enMessages;

  return (
    <NextIntlClientProvider locale={validLocale} messages={messages}>
      <QuickAddVisitModalContent isOpen={isOpen} onClose={onClose} />
    </NextIntlClientProvider>
  );
}
