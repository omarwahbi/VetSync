"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  User,
  Phone,
  Mail,
  PawPrint,
  PlusCircle,
  ChevronLeft,
  Edit,
  MoreHorizontal,
  Eye,
  Trash2,
  MapPin,
  SlidersHorizontal,
  Check,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatPhoneNumberForWhatsApp } from "@/lib/phoneUtils";
import { formatDisplayDateTime } from "@/lib/utils";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OwnerForm } from "@/components/forms/owner-form";
import { PetForm } from "@/components/forms/pet-form";

// Simple Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address?: string | null;
  allowAutomatedReminders: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: User;
  updatedBy?: User;
  pets?: Pet[];
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birthDate: string | null;
  createdBy?: User;
  updatedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

interface OwnerFormValues {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  allowAutomatedReminders: boolean;
}

interface PetFormValues {
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birthDate?: Date | null;
  ownerId?: string;
  notes?: string;
}

// Function to fetch owner details with their pets
const fetchOwnerDetails = async (ownerId: string): Promise<Owner> => {
  const response = await axiosInstance.get(`/owners/${ownerId}`);
  return response.data;
};

export default function OwnerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const ownerId = params.id as string;
  const locale = params.locale as string;
  const t = useTranslations("Owners");
  const tCommon = useTranslations("Common");
  const tPets = useTranslations("Pets");
  const queryClient = useQueryClient();

  // Dialog states
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isEditPetDialogOpen, setIsEditPetDialogOpen] = useState(false);
  const [isDeletePetDialogOpen, setIsDeletePetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Column visibility state - simplified
  const [petColumnsVisibility, setPetColumnsVisibility] = useState({
    name: true,
    species: true,
    breed: true,
    gender: true,
    createdBy: false,
    updatedBy: false,
    actions: true,
  });

  const {
    data: ownerData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["owner", ownerId],
    queryFn: () => fetchOwnerDetails(ownerId),
    enabled: !!ownerId,
  });

  // Update owner mutation
  const { mutate: updateOwner, isPending: isUpdatingOwner } = useMutation({
    mutationFn: async (formData: OwnerFormValues) => {
      const response = await axiosInstance.patch(
        `/owners/${ownerId}`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      setIsOwnerDialogOpen(false);
      toast.success(t("ownerUpdatedSuccess"));
    },
    onError: (error: AxiosError) => {
      toast.error(
        `${t("failedToUpdateOwner")}: ${error.message || t("anErrorOccurred")}`
      );
    },
  });

  // Create pet mutation
  const { mutate: createPet, isPending: isCreatingPet } = useMutation({
    mutationFn: async (formData: PetFormValues) => {
      const response = await axiosInstance.post(
        `/owners/${ownerId}/pets`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      // Also invalidate pets list if you have a global pets query
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      setIsPetDialogOpen(false);
      toast.success(tPets("petCreatedSuccess"));
    },
    onError: (error: AxiosError) => {
      toast.error(
        `${tPets("errorCreatingPet")}: ${error.message || t("anErrorOccurred")}`
      );
    },
  });

  // Update pet mutation
  const { mutate: updatePet, isPending: isUpdatingPet } = useMutation({
    mutationFn: async ({
      petId,
      formData,
    }: {
      petId: string;
      formData: PetFormValues;
    }) => {
      const response = await axiosInstance.patch(
        `/owners/${ownerId}/pets/${petId}`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      setIsEditPetDialogOpen(false);
      toast.success(tPets("petUpdatedSuccess"));
    },
    onError: (error: AxiosError) => {
      toast.error(
        `${tPets("failedToUpdatePet")}: ${
          error.message || t("anErrorOccurred")
        }`
      );
    },
  });

  // Delete pet mutation
  const { mutate: deletePet, isPending: isDeletingPet } = useMutation({
    mutationFn: async (petId: string) => {
      const response = await axiosInstance.delete(
        `/owners/${ownerId}/pets/${petId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      setIsDeletePetDialogOpen(false);
      toast.success(tPets("petDeletedSuccess"));
    },
    onError: (error: AxiosError) => {
      toast.error(
        `${tPets("failedToDeletePet")}: ${
          error.message || t("anErrorOccurred")
        }`
      );
    },
  });

  // Delete owner mutation
  const { mutate: deleteOwner, isPending: isDeletingOwner } = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(`/owners/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      toast.success(t("ownerDeletedSuccess"));
      router.push(`/${locale}/owners`);
    },
    onError: (error: AxiosError) => {
      toast.error(
        `${t("failedToDeleteOwner")}: ${error.message || t("anErrorOccurred")}`
      );
    },
  });

  const handleUpdateOwner = (formData: OwnerFormValues) => {
    updateOwner(formData);
  };

  const handleCreatePet = (formData: PetFormValues) => {
    createPet({ ...formData, ownerId });
  };

  const handleUpdatePet = (formData: PetFormValues) => {
    if (selectedPet) {
      updatePet({ petId: selectedPet.id, formData });
    }
  };

  const handleDeletePet = () => {
    if (selectedPet) {
      deletePet(selectedPet.id);
    }
  };

  const handleDeleteOwner = () => {
    deleteOwner(ownerId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/owners`}>
              <ChevronLeft className="h-4 w-4 me-1" />
              {t("backToOwners")}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-7 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/owners`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {t("backToOwners")}
          </Link>
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              {t("errorLoading")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {(error as AxiosError)?.message || t("unknownError")}
            </p>
            <Button onClick={() => router.push(`/${locale}/owners`)}>
              {t("backToOwners")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const owner = ownerData;
  if (!owner) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/owners`}>
              <ChevronLeft className="h-4 w-4 me-1" />
              {t("backToOwners")}
            </Link>
          </Button>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsOwnerDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4 me-1" />
            {t("edit")}
          </Button>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4 me-1" />
                {t("delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteOwner")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteOwnerConfirmation")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOwner}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingOwner ? tCommon("pleaseWait") : tCommon("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Owner Details Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {owner.firstName} {owner.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Contact Details */}
              <div className="grid gap-2">
                {/* Email */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">{t("email")}</p>
                    {owner.email ? (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {owner.email}
                        </p>
                        <a
                          href={`mailto:${owner.email}`}
                          className="inline-flex h-6 items-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {t("sendEmail")}
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {t("noEmailProvided")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">{t("phone")}</p>
                    {owner.phone ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          {owner.phone}
                        </p>
                        <div className="flex gap-1 text-xs">
                          <a
                            href={`tel:${owner.phone}`}
                            className="inline-flex h-6 items-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {t("call")}
                          </a>
                          <a
                            href={`https://wa.me/${formatPhoneNumberForWhatsApp(
                              owner.phone
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-6 items-center rounded-md bg-green-600 px-2 text-xs font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {t("sendWhatsApp")}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {t("noPhoneProvided")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">{t("address")}</p>
                    {owner.address ? (
                      <p className="text-sm text-muted-foreground">
                        {owner.address}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {t("noAddressProvided")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Automated Reminders */}
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="ms-3 space-y-1">
                    <p className="text-sm font-medium">{t("reminders")}</p>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          owner.allowAutomatedReminders ? "default" : "outline"
                        }
                        className="flex items-center gap-1 text-xs"
                      >
                        {owner.allowAutomatedReminders && (
                          <Check className="h-3 w-3" />
                        )}
                        {owner.allowAutomatedReminders
                          ? t("reminderEnabled")
                          : t("reminderDisabled")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                {owner.createdBy && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {t("createdBy")}
                    </p>
                    <p>
                      {owner.createdBy.firstName} {owner.createdBy.lastName}
                    </p>
                  </div>
                )}
                {owner.createdAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {t("createdAt")}
                    </p>
                    <p>{formatDisplayDateTime(owner.createdAt)}</p>
                  </div>
                )}
                {owner.updatedBy && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {t("updatedBy")}
                    </p>
                    <p>
                      {owner.updatedBy.firstName} {owner.updatedBy.lastName}
                    </p>
                  </div>
                )}
                {owner.updatedAt && (
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {t("updatedAt")}
                    </p>
                    <p>{formatDisplayDateTime(owner.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              {t("quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button
                className="w-full flex items-center justify-start gap-2"
                onClick={() => setIsPetDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                {tPets("addNewPet")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pets Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{t("pets")}</CardTitle>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => {
                setPetColumnsVisibility((prev) => ({
                  ...prev,
                  createdBy: !prev.createdBy,
                  updatedBy: !prev.updatedBy,
                }));
              }}
            >
              <SlidersHorizontal className="h-4 w-4 me-1" />
              {t("viewDetails")}
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsPetDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 me-1" />
              {tPets("addNewPet")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {owner.pets && owner.pets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tPets("name")}</TableHead>
                  <TableHead>{tPets("species")}</TableHead>
                  {petColumnsVisibility.breed && (
                    <TableHead>{tPets("breed")}</TableHead>
                  )}
                  {petColumnsVisibility.gender && (
                    <TableHead>{tPets("gender")}</TableHead>
                  )}
                  {petColumnsVisibility.createdBy && (
                    <TableHead>{tCommon("createdBy")}</TableHead>
                  )}
                  {petColumnsVisibility.updatedBy && (
                    <TableHead>{tCommon("updatedBy")}</TableHead>
                  )}
                  {petColumnsVisibility.actions && (
                    <TableHead className="text-end">
                      {tCommon("actions")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {owner.pets.map((pet) => (
                  <TableRow key={pet.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/${locale}/pets/${pet.id}`}
                        className="hover:underline text-primary hover:text-primary/90"
                      >
                        {pet.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {pet.species ? tPets(pet.species.toLowerCase()) : "-"}
                    </TableCell>
                    {petColumnsVisibility.breed && (
                      <TableCell>{pet.breed || "-"}</TableCell>
                    )}
                    {petColumnsVisibility.gender && (
                      <TableCell>
                        {pet.gender ? tPets(pet.gender.toLowerCase()) : "-"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.createdBy && (
                      <TableCell>
                        {pet.createdBy
                          ? `${pet.createdBy.firstName} ${pet.createdBy.lastName}`
                          : "-"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.updatedBy && (
                      <TableCell>
                        {pet.updatedBy
                          ? `${pet.updatedBy.firstName} ${pet.updatedBy.lastName}`
                          : "-"}
                      </TableCell>
                    )}
                    {petColumnsVisibility.actions && (
                      <TableCell className="text-end">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Open menu"
                              onClick={(e) => {
                                // Stop propagation to prevent table row click
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-40"
                            sideOffset={5}
                            collisionPadding={10}
                            forceMount
                          >
                            <DropdownMenuItem
                              className="cursor-pointer"
                              asChild
                              inset
                            >
                              <Link
                                href={`/${locale}/pets/${pet.id}`}
                                className="flex w-full items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye className="h-4 w-4" />
                                {tPets("viewDetails")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedPet(pet);
                                setIsEditPetDialogOpen(true);
                              }}
                              inset={true}
                            >
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                {tPets("edit")}
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-500"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedPet(pet);
                                setIsDeletePetDialogOpen(true);
                              }}
                              inset={true}
                            >
                              <div className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                {tPets("delete")}
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <PawPrint className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-medium">{t("noPets")}</h3>
              <Button
                onClick={() => setIsPetDialogOpen(true)}
                className="mt-3"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 me-2" />
                {tPets("addNewPet")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Owner Dialog */}
      <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("editOwner")}</DialogTitle>
          </DialogHeader>
          <OwnerForm
            initialData={{
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email || undefined,
              phone: owner.phone,
              address: owner.address || undefined,
              allowAutomatedReminders: owner.allowAutomatedReminders,
            }}
            onSubmit={handleUpdateOwner}
            onClose={() => setIsOwnerDialogOpen(false)}
            isLoading={isUpdatingOwner}
          />
        </DialogContent>
      </Dialog>

      {/* Add Pet Dialog */}
      <Dialog
        open={isPetDialogOpen}
        onOpenChange={(open) => {
          if (!isCreatingPet) {
            setIsPetDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tPets("addNewPet")}</DialogTitle>
            <DialogDescription>{t("addPetsMessage")}</DialogDescription>
          </DialogHeader>
          <PetForm
            owners={[
              {
                id: ownerId,
                firstName: owner.firstName,
                lastName: owner.lastName,
                email: owner.email || "",
                phone: owner.phone,
              },
            ]}
            initialData={{
              species: "dog",
              ownerId: ownerId,
            }}
            onSubmit={handleCreatePet}
            onClose={() => {
              if (!isCreatingPet) {
                setIsPetDialogOpen(false);
              }
            }}
            isLoading={isCreatingPet}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Pet Dialog */}
      <Dialog
        open={isEditPetDialogOpen}
        onOpenChange={(open) => {
          if (!isUpdatingPet) {
            setIsEditPetDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPet
                ? `${tPets("editPet")}: ${selectedPet.name}`
                : tPets("editPet")}
            </DialogTitle>
          </DialogHeader>
          {selectedPet && (
            <PetForm
              initialData={{
                name: selectedPet.name,
                species: selectedPet.species,
                breed: selectedPet.breed || undefined,
                gender: selectedPet.gender || undefined,
                birthDate: selectedPet.birthDate
                  ? new Date(selectedPet.birthDate)
                  : null,
              }}
              owners={[
                {
                  id: ownerId,
                  firstName: owner.firstName,
                  lastName: owner.lastName,
                  email: owner.email || "",
                  phone: owner.phone,
                },
              ]}
              onSubmit={handleUpdatePet}
              onClose={() => setIsEditPetDialogOpen(false)}
              isLoading={isUpdatingPet}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Pet Dialog */}
      <AlertDialog
        open={isDeletePetDialogOpen}
        onOpenChange={setIsDeletePetDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPets("deletePet")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPet && (
                <>
                  {tPets("confirmDeletePet")}
                  <div className="mt-2 p-2 border rounded bg-muted">
                    <p className="font-semibold">{selectedPet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPet.species} •{" "}
                      {selectedPet.breed || tPets("unknown")}
                    </p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPet}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingPet}
            >
              {isDeletingPet ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {tCommon("pleaseWait")}
                </>
              ) : (
                tCommon("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
