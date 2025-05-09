"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  PawPrint,
  User,
  ClipboardList,
  PlusCircle,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  Bell,
  BellOff,
  Cake,
  Trash2,
  Loader2,
  SlidersHorizontal,
  Check,
  CalendarDays,
} from "lucide-react";

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
  TableCaption,
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
import { Separator } from "@/components/ui/separator";
import { PetForm, PetFormValues } from "@/components/forms/pet-form";
import { VisitForm, VisitFormValues } from "@/components/forms/visit-form";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  notes: string | null;
  nextReminderDate: string | null;
  isReminderEnabled: boolean;
  price: number | null;
  createdBy?: User;
  updatedBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birthDate: string | null;
  notes: string | null;
  owner: Owner;
  visits?: Visit[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: User;
  updatedBy?: User;
}

// Type definition for API error response
interface ErrorResponse {
  message: string;
}

// Function to fetch pet details with its owner and visits
const fetchPetDetails = async (petId: string): Promise<Pet> => {
  const response = await axiosInstance.get(`/pets/${petId}`);
  return response.data;
};

// Function to format currency
const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "N/A";

  // Format with commas and 2 decimal places
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "IQD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export function PetDetailsClient() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;
  const locale = params.locale as string;
  const t = useTranslations("Pets");
  const queryClient = useQueryClient();

  // Dialog states
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [isVisitEditDialogOpen, setIsVisitEditDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingVisit, setDeletingVisit] = useState<Visit | null>(null);

  // Column visibility state for visits table - simplified
  const [visitColumnsVisibility, setVisitColumnsVisibility] = useState({
    date: true,
    type: true,
    notes: true,
    nextReminder: true,
    reminderStatus: true,
    price: true,
    createdBy: false,
    updatedBy: false,
    actions: true,
  });

  const {
    data: petData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => fetchPetDetails(petId),
    enabled: !!petId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Update pet mutation
  const { mutate: updatePet, isPending: isUpdatingPet } = useMutation({
    mutationFn: async (formData: PetFormValues) => {
      const response = await axiosInstance.patch(
        `/owners/${petData?.owner?.id}/pets/${petId}`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the pet cache
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      setIsPetDialogOpen(false);
      toast.success(t("petUpdatedSuccess"));
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || t("unknownError");
      toast.error(`${t("failedToUpdatePet")} ${errorMessage}`);
    },
  });

  // Create visit mutation
  const { mutate: createVisit, isPending: isCreatingVisit } = useMutation({
    mutationFn: async (formData: VisitFormValues) => {
      // Format dates for API
      const formattedData = {
        ...formData,
        visitDate: formData.visitDate.toISOString(),
        nextReminderDate: formData.nextReminderDate
          ? formData.nextReminderDate.toISOString()
          : null,
        price: formData.price,
      };

      const response = await axiosInstance.post(
        `/pets/${petId}/visits`,
        formattedData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });

      setIsVisitDialogOpen(false);
      toast.success(t("visitCreatedSuccess"));
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || t("unknownError");
      toast.error(`${t("failedToCreateVisit")} ${errorMessage}`);
    },
  });

  // Update visit mutation
  const { mutate: updateVisit, isPending: isUpdatingVisit } = useMutation({
    mutationFn: async (data: {
      visitId: string;
      updateData: VisitFormValues;
    }) => {
      const { visitId, updateData } = data;

      // Format dates for API
      const formattedData = {
        ...updateData,
        visitDate: updateData.visitDate.toISOString(),
        nextReminderDate: updateData.nextReminderDate
          ? updateData.nextReminderDate.toISOString()
          : null,
        price: updateData.price,
      };

      const response = await axiosInstance.patch(
        `/pets/${petId}/visits/${visitId}`,
        formattedData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });

      setIsVisitEditDialogOpen(false);
      setEditingVisit(null);
      toast.success(t("visitUpdatedSuccess"));
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || t("unknownError");
      toast.error(`${t("failedToUpdateVisit")} ${errorMessage}`);
    },
  });

  // Delete pet mutation
  const { mutate: deletePet, isPending: isDeletingPet } = useMutation({
    mutationFn: async (ids: { ownerId: string; petId: string }) => {
      const response = await axiosInstance.delete(
        `/owners/${ids.ownerId}/pets/${ids.petId}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("petDeletedSuccess"));

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pets"] });

      if (petData?.owner?.id) {
        queryClient.invalidateQueries({
          queryKey: ["owner", petData.owner.id],
        });
      }

      // Redirect to the owner's detail page or pets list
      if (petData?.owner?.id) {
        router.push(`/${locale}/owners/${petData.owner.id}`);
      } else {
        router.push(`/${locale}/pets`);
      }
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || t("unknownError");
      toast.error(`${t("failedToDeletePet")} ${errorMessage}`);
    },
  });

  // Delete visit mutation
  const { mutate: deleteVisit, isPending: isDeletingVisit } = useMutation({
    mutationFn: async (ids: { petId: string; visitId: string }) => {
      await axiosInstance.delete(`/pets/${ids.petId}/visits/${ids.visitId}`);
      return ids.visitId; // Return the visitId for cache updates
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      queryClient.invalidateQueries({ queryKey: ["visits", petId] });

      toast.success(t("visitDeletedSuccess"));
      setDeletingVisit(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message || error.message || t("unknownError");
      toast.error(`${t("failedToDeleteVisit")} ${errorMessage}`);
      setDeletingVisit(null);
    },
  });

  // Function to toggle column visibility
  const toggleColumn = (column: keyof typeof visitColumnsVisibility) => {
    setVisitColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleUpdatePet = (formData: PetFormValues) => {
    // Convert dates to ISO strings for API
    const formattedData = {
      ...formData,
      // Convert dates to ISO strings for API if needed
      birthDate: formData.birthDate ? formData.birthDate : null,
    };

    updatePet(formattedData);
  };

  const handleCreateVisit = (formData: VisitFormValues) => {
    createVisit(formData);
  };

  const handleUpdateVisit = (formData: VisitFormValues) => {
    if (!editingVisit || !editingVisit.id) {
      toast.error(t("cannotUpdatePetMissingInfo"));
      return;
    }

    updateVisit({
      visitId: editingVisit.id,
      updateData: formData,
    });
  };

  const handleDeletePet = () => {
    if (!petData || !petData.owner || !petData.owner.id) {
      toast.error(t("cannotDeletePetMissingInfo"));
      return;
    }

    deletePet({
      ownerId: petData.owner.id,
      petId,
    });
  };

  const confirmDeleteVisit = () => {
    if (!deletingVisit?.id) {
      toast.error(t("cannotDeletePetMissingInfo"));
      return;
    }

    deleteVisit({
      petId,
      visitId: deletingVisit.id,
    });
  };

  // Function to get appropriate badge color for visit type
  const getVisitTypeBadgeColor = (visitType: string) => {
    // Implementation of getVisitTypeBadgeColor
  };

  // Function to get species badge color
  const getSpeciesBadgeColor = (species: string) => {
    // Implementation of getSpeciesBadgeColor
  };

  // Format a date with fallback
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return formatDisplayDate(dateString);
    } catch (error) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/pets`}>
              <ChevronLeft className="h-4 w-4 me-1" />
              {t("backToPets")}
            </Link>
          </Button>
        </div>

        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">{t("petDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <PawPrint className="h-5 w-5 me-2 text-muted-foreground" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex items-center">
                <User className="h-5 w-5 me-2 text-muted-foreground" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="flex items-center">
                <Cake className="h-5 w-5 me-2 text-muted-foreground" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center">
                <Cake className="h-5 w-5 me-2 text-muted-foreground" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center">
                <Cake className="h-5 w-5 me-2 text-muted-foreground" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">{t("visitHistory")}</CardTitle>
          </CardHeader>
          <CardContent className="">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !petData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/pets`}>
              <ChevronLeft className="h-4 w-4 me-1" />
              {t("backToPets")}
            </Link>
          </Button>
        </div>

        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">{t("petDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="text-red-500">
              {t("error")}: {(error as Error)?.message || t("unknownError")}
            </div>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/${locale}/pets`}>{t("backToPets")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/pets`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {t("backToPets")}
          </Link>
        </Button>
      </div>

      {/* Pet Details Card */}
      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{t("petDetails")}</CardTitle>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsPetDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              {t("edit")}
            </Button>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deletePet")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("confirmDeletePet")}
                    <span className="font-medium">{petData?.name}</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeletePet}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeletingPet}
                  >
                    {isDeletingPet ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {t("pleaseWait")}
                      </>
                    ) : (
                      t("delete")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <PawPrint className="h-5 w-5 me-2 text-muted-foreground" />
              <span className="font-medium text-lg">{petData.name}</span>
            </div>

            <div className="flex items-center">
              <User className="h-5 w-5 me-2 text-muted-foreground" />
              <span className="font-medium me-2">{t("owner")}</span>
              <Link
                href={`/${locale}/owners/${petData.owner.id}`}
                className="text-primary hover:underline"
              >
                {petData.owner.firstName} {petData.owner.lastName}
              </Link>
            </div>

            <div className="flex items-center">
              <Cake className="h-5 w-5 me-2 text-muted-foreground" />
              <span className="font-medium me-2">{t("species")}</span>
              <span>{petData.species}</span>
            </div>

            {petData.breed && (
              <div className="flex items-center">
                <Cake className="h-5 w-5 me-2 text-muted-foreground" />
                <span className="font-medium me-2">{t("breed")}</span>
                <span>{petData.breed}</span>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("birthDate")}
              </p>
              <p className="text-base">
                {formatDisplayDate(petData.birthDate)}
              </p>
            </div>

            {petData.gender && (
              <div className="flex items-center">
                <span className="font-medium me-2">{t("gender")}</span>
                <span>
                  {t(
                    petData.gender.toLowerCase() as
                      | "male"
                      | "female"
                      | "unknown"
                  )}
                </span>
              </div>
            )}

            {petData.notes && (
              <div className="mt-4">
                <span className="font-medium">{t("notes")}</span>
                <p className="mt-1 text-muted-foreground">{petData.notes}</p>
              </div>
            )}

            {/* Audit Information */}
            <div className="text-xs text-muted-foreground mt-4">
              <p>
                {t("createdon")} {formatDisplayDateTime(petData.createdAt)}
              </p>
              {petData.updatedAt && petData.updatedAt !== petData.createdAt && (
                <p>
                  {t("updatedBy")} {formatDisplayDateTime(petData.updatedAt)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pet Information Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Pet details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <PawPrint className="mr-2 h-5 w-5 text-muted-foreground" />
                  {t("petInformation")}
                </h3>
                <Separator className="my-2" />

                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">
                      {t("name")}:
                    </dt>
                    <dd>{petData?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">
                      {t("species")}:
                    </dt>
                    <dd>{petData?.species}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">
                      {t("breed")}:
                    </dt>
                    <dd>{petData?.breed || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">
                      {t("gender")}:
                    </dt>
                    <dd>
                      {petData?.gender
                        ? t(
                            petData.gender.toLowerCase() as
                              | "male"
                              | "female"
                              | "unknown"
                          )
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">
                      {t("birthDate")}:
                    </dt>
                    <dd>{formatDate(petData?.birthDate || undefined)}</dd>
                  </div>
                </dl>
              </div>

              {petData?.notes && (
                <div>
                  <h3 className="text-sm font-semibold flex items-center">
                    <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                    {t("notes")}
                  </h3>
                  <Separator className="my-2" />
                  <p className="text-sm whitespace-pre-wrap">{petData.notes}</p>
                </div>
              )}
            </div>

            {/* Right column - Owner and metadata */}
            <div className="space-y-4">
              {petData?.owner && (
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="mr-2 h-5 w-5 text-muted-foreground" />
                    {t("ownerInformation")}
                  </h3>
                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        {t("name")}:
                      </dt>
                      <dd>
                        <Link
                          href={`/${locale}/owners/${petData.owner.id}`}
                          className="text-primary hover:underline"
                        >
                          {petData.owner.firstName} {petData.owner.lastName}
                        </Link>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        {t("email")}:
                      </dt>
                      <dd>{petData.owner.email || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        {t("phone")}:
                      </dt>
                      <dd>{petData.owner.phone || "—"}</dd>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  {t("petHistory")}
                </h3>
                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("createdBy")}</p>
                    <p>{formatDate(petData?.createdAt)}</p>
                    {petData?.createdBy && (
                      <p className="text-xs text-muted-foreground">
                        {petData.createdBy.firstName}{" "}
                        {petData.createdBy.lastName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("updatedBy")}</p>
                    <p>{formatDate(petData?.updatedAt)}</p>
                    {petData?.updatedBy && (
                      <p className="text-xs text-muted-foreground">
                        {petData.updatedBy.firstName}{" "}
                        {petData.updatedBy.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit History Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <ClipboardList className="h-5 w-5 me-2 text-muted-foreground" />
            {t("visitHistory")}
          </CardTitle>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 me-2" />
                  {t("manageColumns")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("type")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.type && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("visitType")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("notes")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.notes && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("notes")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("nextReminder")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.nextReminder && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("nextReminder")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("reminderStatus")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.reminderStatus && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("reminderEnabled")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("price")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.price && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("price")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("createdBy")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.createdBy && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("createdBy")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("updatedBy")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.updatedBy && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("updatedBy")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleColumn("actions")}
                  inset={false}
                >
                  <div className="me-2 h-4 w-4 flex items-center justify-center">
                    {visitColumnsVisibility.actions && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  {t("actions")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsVisitDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              {t("addVisit")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="">
          {petData.visits && petData.visits.length > 0 ? (
            <Table>
              <TableCaption>
                {t("visitHistory")} {petData.name}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">{t("date")}</TableHead>
                  {visitColumnsVisibility.type && (
                    <TableHead className="font-medium">
                      {t("visitType")}
                    </TableHead>
                  )}
                  {visitColumnsVisibility.notes && (
                    <TableHead className="font-medium">{t("notes")}</TableHead>
                  )}
                  {visitColumnsVisibility.nextReminder && (
                    <TableHead className="font-medium">
                      {t("nextReminder")}
                    </TableHead>
                  )}
                  {visitColumnsVisibility.reminderStatus && (
                    <TableHead className="font-medium">
                      {t("reminderEnabled")}
                    </TableHead>
                  )}
                  {visitColumnsVisibility.price && (
                    <TableHead className="font-medium">{t("price")}</TableHead>
                  )}
                  {visitColumnsVisibility.createdBy && (
                    <TableHead className="font-medium">
                      {t("createdBy")}
                    </TableHead>
                  )}
                  {visitColumnsVisibility.updatedBy && (
                    <TableHead className="font-medium">
                      {t("updatedBy")}
                    </TableHead>
                  )}
                  {visitColumnsVisibility.actions && (
                    <TableHead className="text-end font-medium">
                      {t("actions")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {petData.visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{formatDisplayDate(visit.visitDate)}</TableCell>
                    {visitColumnsVisibility.type && (
                      <TableCell className="text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-800"
                        >
                          {visit.visitType}
                        </Badge>
                      </TableCell>
                    )}
                    {visitColumnsVisibility.notes && (
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {visit.notes || "-"}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.nextReminder && (
                      <TableCell className="hidden md:table-cell">
                        {visit.nextReminderDate
                          ? formatDisplayDate(visit.nextReminderDate)
                          : "-"}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.reminderStatus && (
                      <TableCell>
                        {visit.isReminderEnabled ? (
                          <span className="flex items-center text-green-600">
                            <Bell className="h-4 w-4 me-1" />
                            {t("reminderEnabled")}
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-500">
                            <BellOff className="h-4 w-4 me-1" />
                            {t("reminderDisabled")}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.price && (
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(visit.price)}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.createdBy && (
                      <TableCell className="text-muted-foreground">
                        {visit.createdBy
                          ? `${visit.createdBy.firstName || ""} ${
                              visit.createdBy.lastName || ""
                            }`.trim() || "System"
                          : "System"}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.updatedBy && (
                      <TableCell className="text-muted-foreground">
                        {visit.updatedBy
                          ? `${visit.updatedBy.firstName || ""} ${
                              visit.updatedBy.lastName || ""
                            }`.trim() || "System"
                          : "System"}
                      </TableCell>
                    )}
                    {visitColumnsVisibility.actions && (
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">
                                {t("viewDetails")}
                              </span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              inset={false}
                              onClick={() => {
                                setEditingVisit(visit);
                                setIsVisitEditDialogOpen(true);
                              }}
                            >
                              <Edit className="me-2 h-4 w-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              inset={false}
                              onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                setDeletingVisit(visit);
                              }}
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {t("delete")}
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
            <div className="py-8 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <p>{t("noVisits")}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setIsVisitDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 me-2" />
                {t("addVisit")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Visit Dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("addVisit")}
              {petData && `: ${petData.name}`}
            </DialogTitle>
          </DialogHeader>
          <VisitForm
            onSubmit={handleCreateVisit}
            onClose={() => setIsVisitDialogOpen(false)}
            isLoading={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
