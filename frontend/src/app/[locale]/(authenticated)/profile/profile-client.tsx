"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
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
import { AlertCircle, ArrowLeft, Edit } from "lucide-react";
import {
  ProfileForm,
  ProfileFormValues,
} from "@/components/forms/profile-form";
import axiosInstance from "@/lib/axios";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/auth";

// Define interfaces
interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface ProfileResponse {
  firstName: string;
  lastName: string;
  email?: string;
}

// Function to update user profile
const updateUserProfile = async (
  data: ProfileFormValues
): Promise<ProfileResponse> => {
  const response = await axiosInstance.patch("/users/me", data);
  return response.data;
};

export function ProfileClient() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("Profile");
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);

  // Update profile mutation
  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      toast.success(t("successMessage"));
      setIsEditing(false);

      // Update the user in the auth store
      if (user) {
        setUser({
          ...user,
          firstName: data.firstName || user.firstName,
          lastName: data.lastName || user.lastName,
        });
      }
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.response?.data?.message || t("errorMessage"));
    },
  });

  const handleSave = (data: ProfileFormValues) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Determine user role display name
  const getRoleDisplayName = (role?: string) => {
    if (!role) return "";

    switch (role) {
      case "ADMIN":
        return "Admin";
      case "CLINIC_ADMIN":
        return "Clinic Admin";
      case "STAFF":
        return "Staff";
      default:
        return role;
    }
  };

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("errorTitle")}</AlertTitle>
        <AlertDescription>
          {t("errorMessage")}
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {t("editProfile")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profileSettings")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <ProfileForm
              initialData={{
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email,
              }}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={mutation.isPending}
            />
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {t("personalInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("firstName")}
                    </h4>
                    <p className="text-lg">{user.firstName || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("lastName")}
                    </h4>
                    <p className="text-lg">{user.lastName || "-"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">
                  {t("accountInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("email")}
                    </h4>
                    <p className="text-lg">{user.email || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      {t("role")}
                    </h4>
                    <p className="text-lg">{getRoleDisplayName(user.role)}</p>
                  </div>
                  {user.clinic && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        {t("clinic")}
                      </h4>
                      <p className="text-lg">{user.clinic.name}</p>
                    </div>
                  )}
                </div>
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
                  <Edit className="mr-2 h-4 w-4" />
                  {t("editProfile")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
