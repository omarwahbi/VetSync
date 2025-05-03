"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import {
  ClinicProfileForm,
  ClinicProfileFormValues,
} from "@/components/forms/clinic-profile-form";
import axiosInstance from "@/lib/axios";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Interfaces
interface ClinicProfile {
  name: string;
  address: string;
  phone: string;
  timezone?: string;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Function to fetch clinic profile
const fetchClinicProfile = async (): Promise<ClinicProfile> => {
  const response = await axiosInstance.get("/clinic-profile");
  return response.data;
};

// Function to update clinic profile
const updateClinicProfile = async (
  data: ClinicProfileFormValues
): Promise<ClinicProfile> => {
  const response = await axiosInstance.patch("/clinic-profile", data);
  return response.data;
};

export function ClinicProfileClient() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("ClinicProfile");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);

  // Fetch clinic profile data
  const {
    data: clinicProfile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["clinicProfile"],
    queryFn: fetchClinicProfile,
  });

  // Update clinic profile mutation
  const mutation = useMutation({
    mutationFn: updateClinicProfile,
    onSuccess: () => {
      toast.success(t("successMessage"));
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["clinicProfile"] });
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.response?.data?.message || t("errorMessage"));
    },
  });

  const handleSave = (data: ClinicProfileFormValues) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
        {!isEditing && clinicProfile && (
          <Button onClick={() => setIsEditing(true)}>{t("editProfile")}</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("clinicSettings")}</CardTitle>
          <CardDescription>{t("clinicSettingsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse p-4">
              <div className="h-4 bg-muted rounded-md mb-4 w-3/4"></div>
              <div className="h-4 bg-muted rounded-md mb-4 w-1/2"></div>
              <div className="h-4 bg-muted rounded-md mb-4 w-5/6"></div>
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("errorTitle")}</AlertTitle>
              <AlertDescription>
                {(error as ErrorResponse)?.message || t("errorMessage")}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${locale}/dashboard`)}
                    className="mr-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("backToDashboard")}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : isEditing ? (
            <ClinicProfileForm
              initialData={clinicProfile}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={mutation.isPending}
            />
          ) : clinicProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("clinicName")}
                  </h3>
                  <p className="text-lg">{clinicProfile.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("clinicPhone")}
                  </h3>
                  <p className="text-lg">{clinicProfile.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("clinicAddress")}
                  </h3>
                  <p className="text-lg">{clinicProfile.address}</p>
                </div>
                {clinicProfile.timezone && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("clinicTimezone")}
                    </h3>
                    <p className="text-lg">{clinicProfile.timezone}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="mr-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("backToDashboard")}
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  {t("editProfile")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">{t("noProfileFound")}</p>
              <Button onClick={() => setIsEditing(true)} className="mt-4">
                {t("createProfile")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
