"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useOwner } from "@/hooks/useOwner";
import { useOwnerMutations } from "@/hooks/useOwnerMutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Home,
  Bell,
  PawPrint,
  User,
  Calendar,
  Plus,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  EditOwnerDialog,
  DeleteOwnerDialog,
} from "@/components/owners/OwnerDialogs";
import { OwnerFormValues } from "@/hooks/useOwnerMutations";
import { usePetsByOwner } from "@/hooks/usePets";
import { formatDisplayDate } from "@/lib/utils";
import { toast } from "sonner";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  createdAt: string;
}

export function OwnerDetailsClient() {
  const params = useParams();
  const ownerId = params.id as string;
  const locale = params.locale as string;
  const t = useTranslations("Owners");
  const petsT = useTranslations("Pets");
  const router = useRouter();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const { owner, isLoading, isError, error } = useOwner(ownerId);
  const { updateOwner, isUpdatingOwner, deleteOwner, isDeletingOwner } =
    useOwnerMutations();
  const { pets, isLoading: isPetsLoading } = usePetsByOwner(ownerId);

  const handleUpdateOwner = (formData: OwnerFormValues) => {
    updateOwner(
      {
        id: ownerId,
        updateData: formData,
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
        },
      }
    );
  };

  const handleDeleteOwner = () => {
    deleteOwner(ownerId, {
      onSuccess: () => {
        router.push(`/${locale}/owners`);
      },
    });
  };

  if (isLoading) {
    return <OwnerDetailsSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/owners`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToOwners")}
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-red-500">
                {t("errorLoading")}{" "}
                {(error as Error)?.message || t("unknownError")}
              </h3>
              <Button
                onClick={() => router.push(`/${locale}/owners`)}
                className="mt-4"
              >
                {t("backToOwners")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/owners`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToOwners")}
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold">{t("ownerNotFound")}</h3>
              <Button
                onClick={() => router.push(`/${locale}/owners`)}
                className="mt-4"
              >
                {t("backToOwners")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/owners`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToOwners")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            {t("edit")}
          </Button>
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="h-5 w-5 text-primary" />
            {owner.firstName} {owner.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="auto">
            <TabsList className="mb-4">
              <TabsTrigger value="details">{t("details")}</TabsTrigger>
              <TabsTrigger value="pets">{t("pets")}</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {t("contactInfo")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{t("email")}</p>
                        <p className="text-muted-foreground">
                          {owner.email || t("noEmailProvided")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{t("phone")}</p>
                        <p className="text-muted-foreground">{owner.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{t("address")}</p>
                        <p className="text-muted-foreground">
                          {owner.address || t("noAddressProvided")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{t("reminders")}</p>
                        <Badge
                          variant="outline"
                          className={
                            owner.allowAutomatedReminders
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {owner.allowAutomatedReminders
                            ? t("reminderEnabled")
                            : t("reminderDisabled")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {t("additionalInfo")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{t("registered")}</p>
                        <p className="text-muted-foreground">
                          {formatDisplayDate(owner.createdAt)}
                        </p>
                      </div>
                    </div>
                    {owner.createdBy && (
                      <div className="flex items-start gap-2">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{t("createdBy")}</p>
                          <p className="text-muted-foreground">
                            {`${owner.createdBy.firstName || ""} ${
                              owner.createdBy.lastName || ""
                            }`.trim() || t("unknown")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pets">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("petsList")}</h3>
                <Button
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() =>
                    router.push(`/${locale}/pets/new?ownerId=${ownerId}`)
                  }
                >
                  <Plus className="h-4 w-4" />
                  {petsT("addNewPet")}
                </Button>
              </div>

              {isPetsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !pets || pets.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <PawPrint className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h4 className="text-lg font-medium mb-2">{t("noPets")}</h4>
                  <p className="text-muted-foreground mb-4">
                    {t("addPetsMessage")}
                  </p>
                  <Button
                    onClick={() =>
                      router.push(`/${locale}/pets/new?ownerId=${ownerId}`)
                    }
                    className="flex items-center gap-1 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    {petsT("addNewPet")}
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-start">
                          {petsT("name")}
                        </TableHead>
                        <TableHead className="text-start">
                          {petsT("species")}
                        </TableHead>
                        <TableHead className="text-start">
                          {petsT("breed")}
                        </TableHead>
                        <TableHead className="text-start">
                          {petsT("age")}
                        </TableHead>
                        <TableHead className="text-end">
                          {petsT("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pets.map((pet: Pet) => (
                        <TableRow key={pet.id}>
                          <TableCell className="font-medium text-start">
                            <Link
                              href={`/${locale}/pets/${pet.id}`}
                              className="text-primary hover:underline"
                            >
                              {pet.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-start">
                            {pet.species
                              ? petsT(pet.species.toLowerCase())
                              : "-"}
                          </TableCell>
                          <TableCell className="text-start">
                            {pet.breed || "-"}
                          </TableCell>
                          <TableCell className="text-start">
                            {pet.birthDate
                              ? calculateAge(new Date(pet.birthDate))
                              : "-"}
                          </TableCell>
                          <TableCell className="text-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() =>
                                router.push(`/${locale}/pets/${pet.id}`)
                              }
                            >
                              {petsT("viewDetails")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Owner Modal */}
      {owner && (
        <EditOwnerDialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          owner={owner}
          onSubmit={handleUpdateOwner}
          isLoading={isUpdatingOwner}
        />
      )}

      {/* Delete Owner Modal */}
      {owner && (
        <DeleteOwnerDialog
          owner={owner}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteOwner}
          isLoading={isDeletingOwner}
        />
      )}
    </div>
  );
}

function OwnerDetailsSkeleton() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("Owners");
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/owners`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToOwners")}
        </Button>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-36 mb-4" />
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate age from birthdate
function calculateAge(birthDate: Date): string {
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  } else {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
}
