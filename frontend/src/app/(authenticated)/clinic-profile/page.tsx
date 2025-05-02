"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Edit, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ClinicProfileForm,
  ClinicProfileFormValues,
} from "@/components/forms/clinic-profile-form";

// Types for the clinic profile data
interface ClinicProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  isActive: boolean;
  canSendReminders?: boolean;
  reminderMonthlyLimit?: number;
  reminderSentThisCycle?: number;
  currentCycleStartDate?: string;
  subscriptionEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper function to render usage status with visual indicators
const renderReminderUsage = (
  sent?: number,
  limit?: number,
  canSendReminders?: boolean
) => {
  const sentCount = sent ?? 0;

  // If reminders are disabled or zero limit
  if (!canSendReminders || limit === 0) {
    return (
      <div className="flex items-center">
        <span className="text-gray-500">{sentCount}</span>
        <AlertCircle className="h-4 w-4 ml-2 text-gray-400" />
      </div>
    );
  }

  // For unlimited reminders
  if (limit === -1) {
    return <span>{sentCount}</span>;
  }

  // Calculate usage percentage
  const usagePercent = limit ? (sentCount / limit) * 100 : 0;
  let textColorClass = "text-gray-700";

  if (usagePercent >= 90) {
    textColorClass = "text-red-600 font-medium";
  } else if (usagePercent >= 75) {
    textColorClass = "text-amber-600";
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <span className={textColorClass}>{sentCount}</span>
        <span className="text-gray-500 ml-1">/ {limit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${
            usagePercent >= 90
              ? "bg-red-500"
              : usagePercent >= 75
              ? "bg-amber-500"
              : "bg-green-500"
          }`}
          style={{ width: `${Math.min(100, usagePercent)}%` }}
        ></div>
      </div>
    </div>
  );
};

// Function to fetch clinic profile
const fetchClinicProfile = async (): Promise<ClinicProfile> => {
  const response = await axiosInstance.get("/clinic-profile");
  return response.data;
};

export default function ClinicProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userRole = user?.role;

  // Helper function to render reminder limits with translations
  const getTranslatedReminderLimit = (
    limit?: number,
    canSendReminders?: boolean
  ) => {
    if (!canSendReminders) {
      return <span className="text-red-600">Disabled</span>;
    }

    if (limit === -1) {
      return <span className="text-blue-600">Unlimited</span>;
    }

    if (limit === 0) {
      return <span className="text-gray-600">Disabled (0 limit)</span>;
    }

    return <span>{limit} per cycle</span>;
  };

  // Query to fetch clinic profile
  const {
    data: clinicProfile,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["clinicProfile"],
    queryFn: fetchClinicProfile,
  });

  // Update clinic profile mutation
  const updateClinicProfileFn = async (updateData: ClinicProfileFormValues) => {
    const response = await axiosInstance.patch("/clinic-profile", updateData);
    return response.data;
  };

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: updateClinicProfileFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicProfile"] });
      toast.success("Clinic profile updated successfully");
      setIsEditing(false);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Error updating clinic profile:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update clinic profile";
      toast.error(errorMessage);
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = (formData: ClinicProfileFormValues) => {
    updateProfile(formData);
  };

  // Error state
  if (isError) {
    return (
      <div className="container py-8">
        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Clinic Profile</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-red-500">
                Error loading clinic profile: {(error as Error).message}
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading || !clinicProfile) {
    return (
      <div className="container py-8">
        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Clinic Profile</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading clinic profile..." />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="container py-8">
        <Card className="bg-white dark:bg-card">
          <CardHeader className="">
            <CardTitle className="text-2xl">Edit Clinic Profile</CardTitle>
          </CardHeader>
          <CardContent className="">
            <ClinicProfileForm
              initialData={{
                name: clinicProfile.name,
                address: clinicProfile.address || "",
                phone: clinicProfile.phone || "",
                timezone: clinicProfile.timezone || "UTC",
              }}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
              isLoading={isUpdating}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Clinic Profile</CardTitle>
          </div>
          {/* Only show edit button for CLINIC_ADMIN users */}
          {userRole === "CLINIC_ADMIN" && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Clinic Name</p>
                  <p className="font-medium">{clinicProfile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {clinicProfile.address || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {clinicProfile.phone || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="font-medium">
                    {clinicProfile.timezone || "UTC"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reminder Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Reminder Settings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {clinicProfile.canSendReminders ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-red-600">Disabled</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Reminder Limit
                  </p>
                  <p className="font-medium">
                    {getTranslatedReminderLimit(
                      clinicProfile.reminderMonthlyLimit,
                      clinicProfile.canSendReminders
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Usage This Cycle
                  </p>
                  <div>
                    {renderReminderUsage(
                      clinicProfile.reminderSentThisCycle,
                      clinicProfile.reminderMonthlyLimit,
                      clinicProfile.canSendReminders
                    )}
                  </div>
                </div>

                {clinicProfile.currentCycleStartDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Cycle
                    </p>
                    <p className="font-medium">
                      {new Date(
                        clinicProfile.currentCycleStartDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  {clinicProfile.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>

              {clinicProfile.subscriptionEndDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Subscription End Date
                  </p>
                  <p className="font-medium">
                    {new Date(
                      clinicProfile.subscriptionEndDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legal Information */}
          <div className="border-t pt-4 mt-6">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Contact your administrator or support if
              you need to change your reminder settings or subscription. Changes
              to these settings can only be made by authorized personnel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
