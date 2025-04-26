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
  isActive: boolean;
  canSendReminders?: boolean;
  reminderMonthlyLimit?: number;
  reminderSentThisCycle?: number;
  currentCycleStartDate?: string;
  subscriptionEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper function to render reminder limits
const renderReminderLimit = (limit?: number, canSendReminders?: boolean) => {
  if (!canSendReminders) {
    return <span className="text-red-600">Disabled (System)</span>;
  }

  if (limit === -1) {
    return <span className="text-blue-600">Unlimited</span>;
  }

  if (limit === 0) {
    return <span className="text-gray-600">Disabled (Limit)</span>;
  }

  return <span>{limit} per cycle</span>;
};

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
              className="flex items-center gap-1"
              onClick={handleEditClick}
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="">
          {isEditing && userRole === "CLINIC_ADMIN" ? (
            <ClinicProfileForm
              initialData={clinicProfile}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
              isLoading={isUpdating}
            />
          ) : (
            <div className="space-y-6">
              <div className="">
                <h3 className="text-lg font-medium">Clinic Name</h3>
                <p className="text-gray-700">{clinicProfile.name}</p>
              </div>
              <div className="">
                <h3 className="text-lg font-medium">Address</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {clinicProfile.address}
                </p>
              </div>
              <div className="">
                <h3 className="text-lg font-medium">Phone Number</h3>
                <p className="text-gray-700">{clinicProfile.phone}</p>
              </div>

              {/* Reminder Usage Section */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="text-lg font-medium mb-4">Reminder Usage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Monthly Reminder Limit:
                    </p>
                    <div className="font-medium">
                      {renderReminderLimit(
                        clinicProfile.reminderMonthlyLimit,
                        clinicProfile.canSendReminders
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Reminders Sent This Cycle:
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
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">
                        Current Cycle Started:
                      </p>
                      <div className="text-gray-700">
                        {new Date(
                          clinicProfile.currentCycleStartDate
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {clinicProfile.subscriptionEndDate && (
                <div className="">
                  <h3 className="text-lg font-medium">Subscription</h3>
                  <p className="text-gray-700">
                    Status:{" "}
                    <span
                      className={
                        clinicProfile.isActive
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {clinicProfile.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <p className="text-gray-700">
                    Expires:{" "}
                    {new Date(
                      clinicProfile.subscriptionEndDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
