"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";

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
  const [step, setStep] = useState<string>("select_owner");
  const [ownerSearchQuery, setOwnerSearchQuery] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get auth token for checking authentication status
  const accessToken = useAuthStore((state) => state.accessToken);

  // Fetch owners query
  const { data: ownersData, isLoading: isLoadingOwners } = useQuery({
    queryKey: ["owners"],
    queryFn: async () => {
      if (!accessToken) {
        console.warn("No access token available for API call");
        return [];
      }

      try {
        const response = await axiosInstance.get("/owners");
        if (!response.data) return [];

        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data as Owner[];
        }

        return Array.isArray(response.data) ? (response.data as Owner[]) : [];
      } catch (error: unknown) {
        console.error("Error fetching owners:", error);
        return [];
      }
    },
    enabled: isOpen && !!accessToken,
    refetchOnWindowFocus: false,
  });

  // Ensure owners is always an array
  const owners = Array.isArray(ownersData) ? ownersData : [];

  // Filter owners based on search query
  const filteredOwners = owners.filter((owner) => {
    if (!ownerSearchQuery) return true;
    const fullName = `${owner.firstName || ""} ${owner.lastName || ""} ${
      owner.phone || ""
    }`.toLowerCase();
    return fullName.includes(ownerSearchQuery.toLowerCase());
  });

  // Fetch pets for selected owner
  const { data: petsData, isLoading: isLoadingPets } = useQuery({
    queryKey: ["pets", selectedOwnerId],
    queryFn: async () => {
      if (!selectedOwnerId || !accessToken) return [];

      try {
        const response = await axiosInstance.get(
          `/owners/${selectedOwnerId}/pets`
        );
        if (!response.data) return [];

        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data as Pet[];
        }

        return Array.isArray(response.data) ? (response.data as Pet[]) : [];
      } catch (error) {
        console.error("Error fetching pets:", error);
        return [];
      }
    },
    enabled: !!selectedOwnerId && !!accessToken && step === "select_pet",
    refetchOnWindowFocus: false,
  });

  // Ensure pets is always an array
  const pets = Array.isArray(petsData) ? petsData : [];

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
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingVisits"] });
      if (selectedPetId) {
        queryClient.invalidateQueries({ queryKey: ["visits", selectedPetId] });
        queryClient.invalidateQueries({ queryKey: ["pet", selectedPetId] });
      }

      toast.success(t("visitCreatedSuccess"));
      handleReset();
    },
    onError: (error: Error) => {
      toast.error(t("failedVisit", { error: error.message }));
    },
  });

  const handleReset = () => {
    setSelectedOwnerId(null);
    setSelectedPetId(null);
    setSelectedPetData(null);
    setSelectedOwnerName("");
    setOwnerSearchQuery("");
    setStep("select_owner");
    onClose();
  };

  const handleCreateVisit = (data: VisitFormValues) => {
    setIsSubmitting(true);
    const visitData = {
      petId: selectedPetId,
      ownerId: selectedOwnerId,
      ...data,
    };

    createVisit(visitData);
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

    // Move to pet selection step
    setStep("select_pet");
  };

  const handleSelectPet = (petId: string) => {
    // Find the pet data from selected ID
    const petData = pets.find((pet) => pet.id === petId);

    if (petData) {
      setSelectedPetId(petId);
      setSelectedPetData(petData);
      // Move to visit form step
      setStep("visit_form");
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {step === "select_owner" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="search-owners" className="block">
              {t("searchOwners")}
            </Label>
            <Input
              id="search-owners"
              placeholder={t("searchOwners")}
              value={ownerSearchQuery}
              onChange={(e) => setOwnerSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="mt-4">
            <Label className="block">{t("selectOwner")}</Label>
            <div className="mt-2 grid gap-2 max-h-[350px] overflow-y-auto">
              {isLoadingOwners ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>{t("loadingOwners")}</span>
                </div>
              ) : filteredOwners.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  {ownerSearchQuery
                    ? `${t("noOwners")} (${t(
                        "searchOwners"
                      )}: ${ownerSearchQuery})`
                    : t("noOwners")}
                </div>
              ) : (
                filteredOwners.map((owner) => (
                  <Button
                    key={owner.id}
                    variant="outline"
                    className="justify-between w-full text-left"
                    onClick={() => handleSelectOwner(owner.id)}
                  >
                    <span>
                      {`${owner.firstName || ""} ${owner.lastName || ""}`}
                      <span className="text-muted-foreground ml-2">
                        {owner.phone}
                      </span>
                    </span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {step === "select_pet" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("select_owner")}
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("back")}
            </Button>

            <span className="font-medium">
              {t("petFor", { name: selectedOwnerName })}
            </span>
          </div>

          <div className="mt-2 grid gap-2 max-h-[350px] overflow-y-auto">
            {isLoadingPets ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{t("loadingPets")}</span>
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center p-4 border rounded-md">
                {t("noPets")}
              </div>
            ) : (
              pets.map((pet) => (
                <Button
                  key={pet.id}
                  variant="outline"
                  className="justify-between w-full text-left"
                  onClick={() => handleSelectPet(pet.id)}
                >
                  <span>
                    {pet.name}{" "}
                    <span className="text-muted-foreground ml-2">
                      ({pet.species})
                    </span>
                  </span>
                </Button>
              ))
            )}
          </div>
        </div>
      )}

      {step === "visit_form" && selectedPetId && selectedPetData && (
        <div className="space-y-4">
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("select_pet")}
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("back")}
            </Button>
          </div>
          <VisitForm
            onSubmit={handleCreateVisit}
            onClose={onClose}
            isLoading={isCreatingVisit || isSubmitting}
            initialData={{
              visitDate: new Date(),
              visitType: "",
              notes: "",
              price: null,
              isReminderEnabled:
                selectedPetData.owner?.allowAutomatedReminders ?? true,
            }}
            selectedPetData={{
              owner: {
                allowAutomatedReminders:
                  selectedPetData.owner?.allowAutomatedReminders,
              },
            }}
            hideButtons={false}
          />
        </div>
      )}
    </div>
  );
}

export function QuickAddVisitModal({
  isOpen,
  onClose,
}: QuickAddVisitModalProps) {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("QuickAddVisit");

  // Validate the locale (defaults to 'en' if missing)
  const validLocale = locale || "en";

  // Get messages directly based on locale
  const messages = validLocale === "ar" ? arMessages : enMessages;

  return (
    <NextIntlClientProvider locale={validLocale} messages={messages}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        modal={true}
      >
        <DialogContent
          className="max-w-3xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("addNewVisit")}</DialogTitle>
            <DialogDescription>{t("quickAddDescription")}</DialogDescription>
          </DialogHeader>
          <QuickAddVisitModalContent isOpen={isOpen} onClose={onClose} />
        </DialogContent>
      </Dialog>
    </NextIntlClientProvider>
  );
}
