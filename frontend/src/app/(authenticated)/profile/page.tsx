"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Lock } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import axiosInstance from "@/lib/axios";
import {
  UserProfileForm,
  UserProfileFormValues,
} from "@/components/forms/user-profile-form";
import {
  ChangePasswordForm,
  ChangePasswordFormValues,
} from "@/components/forms/change-password-form";
import { useAuthStore } from "@/store/auth";

// Types for the user profile data
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

// Function to fetch user profile
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get("/auth/profile");
  return response.data;
};

export default function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  // Query to fetch user profile
  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  // Update user profile mutation
  const updateUserProfileFn = async (updateData: UserProfileFormValues) => {
    // According to the API docs, the update endpoint is /users/me
    // And we should only send firstName and lastName
    const payload = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
    };
    const response = await axiosInstance.patch("/users/me", payload);
    return response.data;
  };

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: updateUserProfileFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      // Update the auth store with new user data
      setUser({
        ...data,
        isAuthenticated: true,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      console.error("Error updating profile:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while updating your profile"
      );
    },
  });

  // Change password mutation
  const changePasswordFn = async (data: ChangePasswordFormValues) => {
    const response = await axiosInstance.patch("/auth/change-password", data);
    return response.data;
  };

  const { mutate: changePassword, isPending: isChangingPwd } = useMutation({
    mutationFn: changePasswordFn,
    onSuccess: () => {
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      console.error("Error changing password:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while changing your password"
      );
    },
  });

  const handleSaveProfile = (formData: UserProfileFormValues) => {
    updateProfile(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    setIsChangingPassword(true);
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
  };

  const handleSubmitPasswordChange = (data: ChangePasswordFormValues) => {
    changePassword(data);
  };

  // Helper function to safely get initials
  const getInitials = () => {
    if (!userProfile) return "U";

    const firstInitial = userProfile.firstName
      ? userProfile.firstName.charAt(0)
      : "";
    const lastInitial = userProfile.lastName
      ? userProfile.lastName.charAt(0)
      : "";

    return firstInitial + lastInitial || "U";
  };

  if (error) {
    return (
      <Card className="">
        <CardHeader className="">
          <CardTitle className="text-2xl">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="">
          <p className="text-destructive">Error: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !userProfile) {
    return (
      <Card className="">
        <CardHeader className="">
          <CardTitle className="text-2xl">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner size="md" text="Loading..." />
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card className="">
        <CardHeader className="">
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="">
          <UserProfileForm
            initialData={{
              firstName: userProfile.firstName || "",
              lastName: userProfile.lastName || "",
              email: userProfile.email || "",
            }}
            onSave={handleSaveProfile}
            onCancel={handleCancel}
            isLoading={isUpdating}
          />
        </CardContent>
      </Card>
    );
  }

  if (isChangingPassword) {
    return (
      <Card className="">
        <CardHeader className="">
          <CardTitle className="text-2xl">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="">
          <ChangePasswordForm
            onSubmit={handleSubmitPasswordChange}
            onCancel={handleCancelPasswordChange}
            isLoading={isChangingPwd}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">My Profile</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="">
              <h3 className="text-lg font-semibold">
                {userProfile.firstName || ""} {userProfile.lastName || ""}
              </h3>
              <p className="text-muted-foreground">{userProfile.role || ""}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userProfile.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(userProfile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              className="gap-1"
            >
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
