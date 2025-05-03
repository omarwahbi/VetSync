"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OwnerForm } from "@/components/forms/owner-form";
import { PetForm } from "@/components/forms/pet-form";
import { VisitForm } from "@/components/forms/visit-form";

// Types for form data
interface OwnerFormData {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  allowAutomatedReminders: boolean;
}

interface PetFormData {
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birthDate?: Date | null;
  notes?: string;
}

interface VisitFormData {
  visitDate: Date;
  visitType: string;
  notes?: string;
  isReminderEnabled?: boolean;
  nextReminderDate?: Date;
}

interface NewClientWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Original component implementation wrapped with provider
function NewClientWizardContent({ isOpen, onClose }: NewClientWizardProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("NewClientWizard");

  // Step management
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [createdOwnerId, setCreatedOwnerId] = useState<string | null>(null);
  const [createdPetId, setCreatedPetId] = useState<string | null>(null);

  // Create owner mutation
  const { mutate: createOwner } = useMutation({
    mutationFn: async (data: OwnerFormData) => {
      const response = await axiosInstance.post("/owners", data);
      return response.data;
    },
    onSuccess: (response) => {
      setCreatedOwnerId(response.id);
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      setStep(2);
      toast.success(t("ownerCreatedSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("failedOwner", { error: error.message }));
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Create pet mutation
  const { mutate: createPet } = useMutation({
    mutationFn: async (data: PetFormData) => {
      if (!createdOwnerId) throw new Error("Owner ID is required");
      const response = await axiosInstance.post(
        `/owners/${createdOwnerId}/pets`,
        data
      );
      return response.data;
    },
    onSuccess: (response) => {
      setCreatedPetId(response.id);
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["owner", createdOwnerId] });
      setStep(3);
      toast.success(t("petCreatedSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("failedPet", { error: error.message }));
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Create visit mutation
  const { mutate: createVisit } = useMutation({
    mutationFn: async (data: VisitFormData) => {
      if (!createdPetId) throw new Error("Pet ID is required");
      const response = await axiosInstance.post(
        `/pets/${createdPetId}/visits`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["visits", createdPetId] });
      queryClient.invalidateQueries({ queryKey: ["pet", createdPetId] });

      // Show success message and close wizard
      toast.success(t("registrationSuccess"));
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(t("failedVisit", { error: error.message }));
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Reset all state when dialog closes
  const handleClose = () => {
    setStep(1);
    setCreatedOwnerId(null);
    setCreatedPetId(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleOwnerSubmit = (data: OwnerFormData) => {
    setIsSubmitting(true);
    createOwner(data);
  };

  const handlePetSubmit = (data: PetFormData) => {
    setIsSubmitting(true);
    createPet(data);
  };

  const handleVisitSubmit = (data: VisitFormData) => {
    setIsSubmitting(true);
    createVisit(data);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return t("ownerInformation");
      case 2:
        return t("petInformation");
      case 3:
        return t("visitDetails");
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return t("ownerDescription");
      case 2:
        return t("petDescription");
      case 3:
        return t("visitDescription");
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        dir="auto"
      >
        <DialogHeader>
          <DialogTitle className="text-start">{getStepTitle()}</DialogTitle>
          <DialogDescription className="text-start">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <OwnerForm
              onSubmit={handleOwnerSubmit}
              onClose={handleClose}
              isLoading={isSubmitting}
              hideButtons
            />
          )}
          {step === 2 && createdOwnerId && (
            <PetForm
              onSubmit={handlePetSubmit}
              onClose={handleClose}
              isLoading={isSubmitting}
              ownerId={createdOwnerId}
              owners={[]}
              hideButtons
            />
          )}
          {step === 3 && createdPetId && (
            <VisitForm
              initialData={{
                visitDate: new Date(),
                visitType: "",
                notes: "",
                isReminderEnabled: true,
                pet: {
                  id: createdPetId || undefined,
                  owner: {
                    allowAutomatedReminders: true,
                  },
                },
              }}
              onSubmit={handleVisitSubmit}
              onClose={handleClose}
              isLoading={isSubmitting}
              hideButtons
            />
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:justify-between rtl:space-x-reverse">
          <div>
            <Button
              variant="outline"
              onClick={() => handleClose()}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
          </div>
          <div>
            {step < 3 ? (
              <Button
                type="submit"
                form={
                  step === 1
                    ? "owner-form"
                    : step === 2
                    ? "pet-form"
                    : undefined
                }
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {t("next")}
              </Button>
            ) : (
              <Button
                type="submit"
                form="visit-form"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {t("finish")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Exported component that wraps the original with proper i18n setup
export function NewClientWizard({ isOpen, onClose }: NewClientWizardProps) {
  const params = useParams();
  const locale = params.locale as string;

  // Validate the locale (defaults to 'en' if missing)
  const validLocale = locale || "en";

  // Get messages directly based on locale
  const messages = validLocale === "ar" ? arMessages : enMessages;

  return (
    <NextIntlClientProvider locale={validLocale} messages={messages}>
      <NewClientWizardContent isOpen={isOpen} onClose={onClose} />
    </NextIntlClientProvider>
  );
}
