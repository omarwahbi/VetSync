"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminCreateUserForm,
  CreateUserFormValues,
} from "@/components/forms/admin-create-user-form";

// Interface for clinic data used in form
interface Clinic {
  id: string;
  name: string;
  isActive: boolean;
}

// Error response interface
interface ErrorResponse {
  message: string;
}

// Function to fetch all active clinics for the dropdown
const fetchAllClinics = async (): Promise<Clinic[]> => {
  const response = await axiosInstance.get("/admin/clinics");
  // Log the raw response for debugging
  console.log("Raw clinic response:", response.data);

  // Check if response has data property (array in an object)
  const clinicsData = response.data.data || response.data;

  // Log the extracted clinics data
  console.log("Extracted clinics data:", clinicsData);

  // Return only active clinics
  const activeClinicsList = Array.isArray(clinicsData)
    ? clinicsData.filter((clinic: Clinic) => clinic.isActive)
    : [];

  // Log the final filtered list
  console.log("Active clinics:", activeClinicsList);

  return activeClinicsList;
};

// Function to create a new user
const createUserFn = async (createData: CreateUserFormValues) => {
  // Add the role field directly here
  const userData = {
    ...createData,
    role: "STAFF", // Hardcode the role as STAFF
  };

  console.log("Creating user with data:", userData); // Log the complete data
  const response = await axiosInstance.post("/admin/users", userData);
  return response.data;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  // Query for fetching clinics for dropdown
  const {
    data: clinics = [],
    isLoading: isLoadingClinics,
    error: clinicsError,
    isError: isClinicsError,
  } = useQuery({
    queryKey: ["adminClinics"],
    queryFn: fetchAllClinics,
  });

  // Mutation for creating a new user
  const { mutate: createUser, isPending: isCreatingUser } = useMutation({
    mutationFn: createUserFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User created successfully");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      // Extract error message from response if available
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create user";

      // Show appropriate message based on the error
      if (errorMessage.includes("already exists")) {
        toast.error(
          "Email already exists. Please use a different email address."
        );
      } else if (errorMessage.includes("clinic")) {
        toast.error("Selected clinic not found or inactive.");
      } else {
        toast.error(`Failed to create user: ${errorMessage}`);
      }
    },
  });

  // Handle user creation
  const handleCreateUser = (formData: CreateUserFormValues) => {
    createUser(formData);
  };

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading clinics...</p>
    </div>
  );

  // Error indicator component
  const ErrorIndicator = ({ message }: { message: string }) => (
    <p className="text-red-500 text-sm">Error loading clinics: {message}</p>
  );

  return (
    <div className="space-y-6">
      {/* User Create Form Card */}
      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold">
              Create New Clinic User
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingClinics ? (
            <div className="flex justify-center py-8">
              <LoadingIndicator />
            </div>
          ) : isClinicsError ? (
            <div className="py-4 text-center">
              <ErrorIndicator message={(clinicsError as Error).message} />
            </div>
          ) : (
            <AdminCreateUserForm
              clinics={clinics}
              onSubmit={handleCreateUser}
              isLoading={isCreatingUser}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
