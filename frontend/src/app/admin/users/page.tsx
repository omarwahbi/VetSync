"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  X,
  Filter,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";
import { useDebounce } from "@/hooks/use-debounce";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AdminCreateUserForm,
  CreateUserFormValues,
} from "@/components/forms/admin-create-user-form";
import { AdminEditUserForm } from "@/components/forms/admin-edit-user-form";
import { ClientOnly } from "@/components/ui/client-only";

// Interface for user data
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  clinic?: {
    id: string;
    name: string;
  } | null;
}

// Interface for meta data
interface MetaData {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

// Interface for clinic data used in form
interface Clinic {
  id: string;
  name: string;
  isActive: boolean;
}

// Interface for user edit data
interface UserEditData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "ADMIN" | "CLINIC_ADMIN" | "STAFF";
  isActive?: boolean;
  clinicId?: string | null;
  password?: string;
}

// Error response interface
interface ErrorResponse {
  message: string;
}

// Function to fetch all active clinics for the dropdown
const fetchAllClinics = async (): Promise<Clinic[]> => {
  const response = await axiosInstance.get("/admin/clinics");
  // Check if response has data property (array in an object)
  const clinicsData = response.data.data || response.data;

  // Return only active clinics
  const activeClinicsList = Array.isArray(clinicsData)
    ? clinicsData.filter((clinic: Clinic) => clinic.isActive)
    : [];

  return activeClinicsList;
};

// Function to fetch all users with filters
const fetchAllUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  role = "",
  clinicId = "",
  isActive = "",
}): Promise<{ data: User[]; meta: MetaData }> => {
  const params: Record<string, string | number | boolean> = {
    page,
    limit,
  };

  if (search) params.search = search;
  if (role && role !== "ALL") params.role = role;
  if (clinicId && clinicId !== "ALL") params.clinicId = clinicId;
  if (isActive && isActive !== "ALL") {
    if (isActive === "ACTIVE") params.isActive = true;
    else if (isActive === "INACTIVE") params.isActive = false;
  }

  const response = await axiosInstance.get("/admin/users", { params });
  return response.data;
};

// Function to create a new user
const createUserFn = async (createData: CreateUserFormValues) => {
  const response = await axiosInstance.post("/admin/users", createData);
  return response.data;
};

// Function to update a user
const updateUserFn = async (
  updateData: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    clinicId: string | null;
    password: string;
  }>,
  userId: string
) => {
  const response = await axiosInstance.patch(
    `/admin/users/${userId}`,
    updateData
  );
  return response.data;
};

// Function to delete a user
const deleteUserFn = async (userId: string) => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [clinicFilter, setClinicFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Use debounced search term to prevent frequent API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, roleFilter, clinicFilter, statusFilter]);

  // Query for fetching users
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: [
      "adminUsers",
      page,
      debouncedSearchTerm,
      roleFilter,
      clinicFilter,
      statusFilter,
    ],
    queryFn: () =>
      fetchAllUsers({
        page,
        search: debouncedSearchTerm,
        role: roleFilter,
        clinicId: clinicFilter,
        isActive: statusFilter,
      }),
  });

  const users = usersData?.data || [];
  const meta = usersData?.meta || {
    totalItems: 0,
    itemCount: 0,
    itemsPerPage: 10,
    totalPages: 1,
    currentPage: 1,
  };

  // Query for fetching clinics for dropdown
  const { data: clinics = [], isLoading: isLoadingClinics } = useQuery({
    queryKey: ["adminClinics"],
    queryFn: fetchAllClinics,
  });

  // Mutation for creating a new user
  const { mutate: createUser, isPending: isCreatingUser } = useMutation({
    mutationFn: createUserFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User created successfully");
      setIsCreateUserOpen(false);
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

  // Mutation for updating a user
  const { mutate: updateUser, isPending: isUpdatingUser } = useMutation({
    mutationFn: ({ data, userId }: { data: UserEditData; userId: string }) =>
      updateUserFn(data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User updated successfully");
      setIsEditUserOpen(false);
      setEditingUser(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      // Extract error message from response if available
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update user";

      // Show appropriate message based on the error
      if (errorMessage.includes("already exists")) {
        toast.error(
          "Email already exists. Please use a different email address."
        );
      } else if (errorMessage.includes("clinic")) {
        toast.error("Selected clinic not found or inactive.");
      } else if (errorMessage.includes("last admin")) {
        toast.error("Cannot change role or deactivate the last admin user.");
      } else {
        toast.error(`Failed to update user: ${errorMessage}`);
      }
    },
  });

  // Mutation for deleting a user
  const { mutate: deleteUser, isPending: isDeletingUser } = useMutation({
    mutationFn: deleteUserFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User deleted successfully");
      setDeletingUser(null);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      // Extract error message from response if available
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete user";

      // Show appropriate message based on the error
      if (errorMessage.includes("last admin")) {
        toast.error("Cannot delete the last admin user.");
      } else {
        toast.error(`Failed to delete user: ${errorMessage}`);
      }
      setDeletingUser(null);
    },
  });

  // Handle user creation
  const handleCreateUser = (formData: CreateUserFormValues) => {
    createUser(formData);
  };

  // Handle user update
  const handleUpdateUser = (data: UserEditData, userId: string) => {
    updateUser({ data, userId });
  };

  // Handle user deletion confirmation
  const confirmDeleteUser = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setClinicFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  };

  // Format user name
  const formatUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return "—";
  };

  // Get badge color for role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "CLINIC_ADMIN":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "STAFF":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <span>Platform Users</span>
          </CardTitle>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsCreateUserOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
                className="w-full"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="ALL" className="cursor-pointer">
                    All Roles
                  </SelectItem>
                  <SelectItem value="ADMIN" className="cursor-pointer">
                    Admin
                  </SelectItem>
                  <SelectItem value="CLINIC_ADMIN" className="cursor-pointer">
                    Clinic Admin
                  </SelectItem>
                  <SelectItem value="DOCTOR" className="cursor-pointer">
                    Doctor
                  </SelectItem>
                  <SelectItem value="STAFF" className="cursor-pointer">
                    Staff
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={clinicFilter}
                onValueChange={setClinicFilter}
                className="w-full"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Clinic" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="ALL" className="cursor-pointer">
                    All Clinics
                  </SelectItem>
                  {clinics.map((clinic) => (
                    <SelectItem
                      key={clinic.id}
                      value={clinic.id}
                      className="cursor-pointer"
                    >
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-full"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="ALL" className="cursor-pointer">
                    All Status
                  </SelectItem>
                  <SelectItem value="ACTIVE" className="cursor-pointer">
                    Active
                  </SelectItem>
                  <SelectItem value="INACTIVE" className="cursor-pointer">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                className="h-10 w-10"
                title="Clear filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Users Table */}
          {isLoadingUsers ? (
            <div className="py-8 flex items-center justify-center">
              <LoadingSpinner size="md" text="Loading users..." />
            </div>
          ) : isUsersError ? (
            <div className="py-8 text-center text-red-500">
              Error loading users: {(usersError as Error).message}
              <Button
                variant="outline"
                onClick={() => refetchUsers()}
                className="ml-4"
              >
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="mb-4">No users found matching your filters</p>
              {(searchTerm ||
                roleFilter !== "ALL" ||
                clinicFilter !== "ALL" ||
                statusFilter !== "") && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {formatUserName(user)}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRoleBadgeColor(user.role)}
                        >
                          {user.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.clinic ? user.clinic.name : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "outline" : "destructive"}
                          className={
                            user.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : ""
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[160px]"
                          >
                            <DropdownMenuLabel
                              className="font-normal"
                              inset={false}
                            >
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-200" />
                            <DropdownMenuItem
                              className="cursor-pointer"
                              inset={false}
                              onClick={() => {
                                setEditingUser(user);
                                setIsEditUserOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              inset={false}
                              onClick={() => setDeletingUser(user)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoadingUsers && !isUsersError && users.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {meta.itemCount} of {meta.totalItems} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm">
                  Page {page} of {meta.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <ClientOnly>
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            {isLoadingClinics ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" text="Loading clinics..." />
              </div>
            ) : (
              <AdminCreateUserForm
                clinics={clinics}
                onSubmit={handleCreateUser}
                isLoading={isCreatingUser}
              />
            )}
          </DialogContent>
        </Dialog>
      </ClientOnly>

      {/* Edit User Dialog */}
      <ClientOnly>
        <Dialog
          open={isEditUserOpen && !!editingUser}
          onOpenChange={(open) => {
            setIsEditUserOpen(open);
            if (!open) setEditingUser(null);
          }}
        >
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {isLoadingClinics || !editingUser ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" text="Loading..." />
              </div>
            ) : (
              <AdminEditUserForm
                initialData={editingUser}
                clinics={clinics}
                onSubmit={handleUpdateUser}
                onClose={() => setIsEditUserOpen(false)}
                isLoading={isUpdatingUser}
              />
            )}
          </DialogContent>
        </Dialog>
      </ClientOnly>

      {/* Delete User Confirmation Dialog */}
      <ClientOnly>
        <AlertDialog
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">
                  {deletingUser ? deletingUser.email : ""}
                </span>
                ? This action cannot be undone.
                {deletingUser && deletingUser.role === "ADMIN" && (
                  <p className="mt-2 text-destructive font-medium">
                    Warning: Deleting an admin user could affect system access.
                  </p>
                )}
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
      </ClientOnly>
    </div>
  );
}
