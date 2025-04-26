"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import axiosInstance from "@/lib/axios";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
} from "@/components/ui/alert-dialog";
import { ClinicCreateUserForm } from "@/components/forms/clinic-create-user-form";

// Type for clinic user
interface ClinicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
}

// Type for API error responses
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

// Function to fetch clinic users
const fetchClinicUsers = async (): Promise<ClinicUser[]> => {
  const response = await axiosInstance.get("/dashboard/clinic-users");
  return response.data;
};

export default function ManageUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ClinicUser | null>(null);

  // Role guard - client-side protection
  useEffect(() => {
    if (user && user.role !== "CLINIC_ADMIN") {
      router.push("/dashboard"); // Redirect non-clinic-admins
    }
  }, [user, router]);

  // Query to fetch clinic users
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["clinicUsers", user?.clinicId],
    queryFn: fetchClinicUsers,
    enabled: !!user?.clinicId,
  });

  // Create staff user mutation
  const { mutate: createStaffUser, isPending: isCreatingUser } = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const response = await axiosInstance.post(
        "/dashboard/clinic-users",
        userData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clinicUsers", user?.clinicId],
      });
      toast.success("Staff user created successfully");
      setIsCreateUserOpen(false);
    },
    onError: (error: ApiError) => {
      const errorMessage =
        error.response?.data?.message || "Failed to create user";
      toast.error(errorMessage);
    },
  });

  // Delete staff user mutation
  const { mutate: deleteStaffUser, isPending: isDeletingUser } = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.delete(
        `/dashboard/clinic-users/${userId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clinicUsers", user?.clinicId],
      });
      toast.success("User deleted successfully");
      setDeletingUser(null);
    },
    onError: (error: ApiError) => {
      const errorMessage =
        error.response?.data?.message || "Failed to delete user";
      toast.error(errorMessage);
      setDeletingUser(null);
    },
  });

  // Handler for creating a user
  const handleCreateUser = (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    createStaffUser(userData);
  };

  // Handler for confirming user deletion
  const confirmDeleteUser = () => {
    if (deletingUser) {
      deleteStaffUser(deletingUser.id);
    }
  };

  // If not a clinic admin, return null (or loading/forbidden component)
  if (user?.role !== "CLINIC_ADMIN") {
    return null;
  }

  return (
    <div className="container py-8">
      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Manage Clinic Staff</CardTitle>
          </div>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsCreateUserOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Staff User
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 flex items-center justify-center">
              <LoadingSpinner size="md" text="Loading users..." />
            </div>
          ) : isError ? (
            <div className="py-6 text-center text-red-500">
              Error loading users: {(error as Error).message}
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="ml-4"
              >
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No users found. Add a staff user to get started.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userRow) => (
                    <TableRow key={userRow.id}>
                      <TableCell className="font-medium">
                        {userRow.firstName || userRow.lastName
                          ? `${userRow.firstName || ""} ${
                              userRow.lastName || ""
                            }`
                          : "—"}
                      </TableCell>
                      <TableCell>{userRow.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${
                            userRow.role === "CLINIC_ADMIN"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          }`}
                        >
                          {userRow.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={userRow.isActive ? "outline" : "destructive"}
                          className={
                            userRow.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : ""
                          }
                        >
                          {userRow.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Only show delete for STAFF users */}
                        {userRow.role === "STAFF" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingUser(userRow)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff User</DialogTitle>
          </DialogHeader>
          <ClinicCreateUserForm
            onSubmit={handleCreateUser}
            onClose={() => setIsCreateUserOpen(false)}
            isLoading={isCreatingUser}
          />
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user{" "}
              <span className="font-medium">{deletingUser?.email || ""}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={isDeletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingUser ? (
                <LoadingSpinner size="sm" text="Deleting..." />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
