"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, UserCog, Edit } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import axiosInstance from "@/lib/axios";
import { useDebounce } from "@/hooks/use-debounce";

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
} from "@/components/ui/alert-dialog";
import { ClinicCreateUserForm } from "@/components/forms/clinic-create-user-form";
import { ClinicEditUserForm } from "@/components/forms/clinic-edit-user-form";

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
const fetchClinicUsers = async (
  page = 1,
  searchTerm = "",
  roleFilter = "ALL",
  statusFilter = "ALL"
): Promise<ClinicUser[]> => {
  const params: Record<string, string | number> = {
    page,
    search: searchTerm || "",
  };

  if (roleFilter !== "ALL") params.role = roleFilter;
  if (statusFilter !== "ALL") params.status = statusFilter;

  const response = await axiosInstance.get("/dashboard/clinic-users", {
    params,
  });
  return response.data;
};

export default function ManageUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial state from URL parameters or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialRoleFilter = searchParams.get("role") || "ALL";
  const initialStatusFilter = searchParams.get("status") || "ALL";

  // State using URL values as initial values
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClinicUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ClinicUser | null>(null);
  const queryClient = useQueryClient();

  // Debounce search term to prevent too many requests
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Function to create a query string from parameters
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | undefined>) => {
      const currentParams = new URLSearchParams(
        Array.from(searchParams.entries())
      );

      // Update or delete parameters
      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          String(value).length === 0 ||
          (typeof value === "string" && value === "ALL")
        ) {
          currentParams.delete(key);
        } else {
          currentParams.set(key, String(value));
        }
      });

      // Always reset page to 1 when filters (not page itself) change
      if (Object.keys(paramsToUpdate).some((k) => k !== "page")) {
        currentParams.set("page", "1");
      }

      return currentParams.toString();
    },
    [searchParams]
  );

  // Function to clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
    router.push(pathname, { scroll: false });
  };

  // Update URL when state changes
  useEffect(() => {
    const paramsToUpdate = {
      page: page === 1 ? undefined : page,
      search: debouncedSearchTerm || undefined,
      role: roleFilter === "ALL" ? undefined : roleFilter,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    };

    const queryString = createQueryString(paramsToUpdate);
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [
    page,
    debouncedSearchTerm,
    roleFilter,
    statusFilter,
    pathname,
    router,
    createQueryString,
  ]);

  // Update local state if URL changes externally (like browser back button)
  useEffect(() => {
    const newPage = parseInt(searchParams.get("page") || "1", 10);
    const newSearch = searchParams.get("search") || "";
    const newRole = searchParams.get("role") || "ALL";
    const newStatus = searchParams.get("status") || "ALL";

    if (newPage !== page) setPage(newPage);
    if (newSearch !== searchTerm) setSearchTerm(newSearch);
    if (newRole !== roleFilter) setRoleFilter(newRole);
    if (newStatus !== statusFilter) setStatusFilter(newStatus);
  }, [searchParams, page, searchTerm, roleFilter, statusFilter]);

  // Query for fetching users with proper query keys
  const {
    data: usersData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "clinicUsers",
      user?.clinicId,
      page,
      debouncedSearchTerm,
      roleFilter,
      statusFilter,
    ],
    queryFn: () =>
      fetchClinicUsers(page, debouncedSearchTerm, roleFilter, statusFilter),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.clinicId,
  });

  // Role guard - client-side protection
  useEffect(() => {
    if (user && user.role !== "CLINIC_ADMIN") {
      router.push("/dashboard"); // Redirect non-clinic-admins
    }
  }, [user, router]);

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
      setIsCreateUserDialogOpen(false);
    },
    onError: (error: ApiError) => {
      const errorMessage =
        error.response?.data?.message || "Failed to create user";
      toast.error(errorMessage);
    },
  });

  // Update user mutation
  const { mutate: updateUser, isPending: isUpdatingUser } = useMutation({
    mutationFn: async (data: {
      userId: string;
      updateData: {
        firstName?: string;
        lastName?: string;
        isActive: boolean;
        role?: string;
      };
    }) => {
      const response = await axiosInstance.patch(
        `/dashboard/clinic-users/${data.userId}`,
        data.updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clinicUsers", user?.clinicId],
      });
      toast.success("User updated successfully");
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: ApiError) => {
      const errorMessage =
        error.response?.data?.message || "Failed to update user";
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

  // Handler for updating a user
  const handleUpdateUser = (formData: {
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    role?: string;
  }) => {
    if (!editingUser) return;

    // Log the update operation for debugging
    console.log("Updating user:", editingUser.id, "with data:", formData);

    updateUser({
      userId: editingUser.id,
      updateData: formData,
    });
  };

  // Handler for confirming user deletion
  const confirmDeleteUser = () => {
    if (deletingUser) {
      deleteStaffUser(deletingUser.id);
    }
  };

  // Handler for edit user button click
  const handleEditClick = (userRow: ClinicUser) => {
    setEditingUser(userRow);
    setIsEditUserDialogOpen(true);
  };

  // Handler for delete dialog
  const handleDeleteClick = (userRow: ClinicUser) => {
    setDeletingUser(userRow);
    setIsDeleteUserDialogOpen(true);
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
            onClick={() => setIsCreateUserDialogOpen(true)}
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
          ) : error ? (
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
          ) : usersData?.length === 0 ? (
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
                  {usersData.map((userRow) => (
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(userRow)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Only show delete for STAFF users */}
                          {userRow.role === "STAFF" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(userRow)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
      <Dialog
        open={isCreateUserDialogOpen}
        onOpenChange={setIsCreateUserDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff User</DialogTitle>
          </DialogHeader>
          <ClinicCreateUserForm
            onSubmit={handleCreateUser}
            onClose={() => setIsCreateUserDialogOpen(false)}
            isLoading={isCreatingUser}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <ClinicEditUserForm
              initialData={editingUser}
              onSubmit={handleUpdateUser}
              onClose={() => setIsEditUserDialogOpen(false)}
              isLoading={isUpdatingUser}
            />
          )}
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
