"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DebouncedSelect, useComponentLogger } from "@/components/debug-tools";

// Logging function to add timestamps
const log = (message: string, data?: unknown) => {
  console.log(
    `[${new Date().toISOString()}] AdminEditUserForm: ${message}`,
    data || ""
  );
};

// Interface for clinic data used in form
interface Clinic {
  id: string;
  name: string;
  isActive: boolean;
}

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

// Define the form schema with zod
const formSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["ADMIN", "CLINIC_ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
  clinicId: z.string().nullable().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

// Define the form values type from the schema
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface AdminEditUserFormProps {
  initialData: User;
  clinics: Clinic[];
  onSubmit: (data: Partial<FormValues>, userId: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function AdminEditUserForm({
  initialData,
  clinics,
  onSubmit,
  onClose,
  isLoading,
}: AdminEditUserFormProps) {
  log("Component rendering with initialData", initialData);
  log("Available clinics", clinics);

  // Track render count - add comment showing we're using this for debug
  useComponentLogger("AdminEditUserForm", {
    initialData,
    clinicsCount: clinics.length,
    isLoading,
  });

  // Prepare initial form values from user data with useMemo
  const defaultValues = useMemo(
    () => ({
      email: initialData.email,
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      role: initialData.role as "ADMIN" | "CLINIC_ADMIN" | "STAFF",
      isActive: initialData.isActive,
      clinicId: initialData.clinic?.id || null,
      password: "",
    }),
    [initialData]
  );

  log("Default form values", defaultValues);

  // Initialize the form with react-hook-form and zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Track select values as state - use simple useState instead of tracked state
  const [role, setRole] = useState<string>(initialData.role);
  const [clinicId, setClinicId] = useState<string | null>(
    initialData.clinic?.id || null
  );

  // Add refs to store previous values and prevent unnecessary rerenders
  const prevInitialDataRef = useRef(initialData);

  // Log when component mounts and unmounts
  useEffect(() => {
    log("Component mounted");
    return () => log("Component unmounted");
  }, []);

  // Reset form only when initialData actually changes (deep comparison)
  useEffect(() => {
    // Only reset if needed - compare ID to avoid deep comparison issues
    if (prevInitialDataRef.current.id !== initialData.id) {
      log("initialData changed - resetting form");

      form.reset(defaultValues);
      setRole(initialData.role);
      setClinicId(initialData.clinic?.id || null);

      // Update ref to new value
      prevInitialDataRef.current = initialData;
    }
  }, [form, initialData, defaultValues]); // Add defaultValues to the dependency array

  // Handle role selection change
  const handleRoleChange = useCallback(
    (value: string) => {
      log("handleRoleChange called with", value);

      // Only update if value is different to prevent unnecessary rerenders
      if (role !== value) {
        setRole(value);

        // Only update form value if different from current value
        const currentRole = form.getValues("role");
        if (currentRole !== value) {
          form.setValue("role", value as "ADMIN" | "CLINIC_ADMIN" | "STAFF", {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }
      }
    },
    [form, role]
  );

  // Handle clinic selection change
  const handleClinicChange = useCallback(
    (value: string) => {
      log("handleClinicChange called with", value);

      const newClinicId = value === "null" ? null : value;

      // Only update if value is different to prevent unnecessary rerenders
      if (clinicId !== newClinicId) {
        setClinicId(newClinicId);

        // Only update form value if different from current value
        const currentClinicId = form.getValues("clinicId");
        if (currentClinicId !== newClinicId) {
          form.setValue("clinicId", newClinicId, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }
      }
    },
    [form, clinicId]
  );

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    log("Form submitted with values", values);

    // Get only the dirty fields to submit
    const dirtyFields = form.formState.dirtyFields;
    log("Dirty fields", dirtyFields);

    const changedValues: Record<string, string | boolean | null> = {};

    // Only include fields that have changed
    Object.keys(dirtyFields).forEach((key) => {
      const fieldKey = key as keyof FormValues;
      // Don't include empty password
      if (fieldKey === "password" && !values[fieldKey]) {
        return;
      }
      changedValues[fieldKey] = values[fieldKey] as string | boolean | null;
    });

    log("Changed values to submit", changedValues);

    // Call the onSubmit handler with changed values
    onSubmit(changedValues as Partial<FormValues>, initialData.id);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 mt-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="user@example.com"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="First name"
                    autoComplete="given-name"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Last name"
                    autoComplete="family-name"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Leave blank to keep current password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Minimum 8 characters. Leave empty to keep current password.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <DebouncedSelect
                  label="Role"
                  value={field.value || role}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleRoleChange(value);
                  }}
                  disabled={isLoading}
                  options={[
                    { value: "ADMIN", label: "Admin" },
                    { value: "CLINIC_ADMIN", label: "Clinic Admin" },
                    { value: "STAFF", label: "Staff" },
                  ]}
                />
              </FormControl>
              <FormDescription>
                Admin: Full system access, Clinic Admin: Manage clinic users,
                Staff: Day-to-day operations
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clinicId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Clinic</FormLabel>
              <FormControl>
                <DebouncedSelect
                  label="Assigned Clinic"
                  value={field.value || clinicId || "null"}
                  onValueChange={(value) => {
                    field.onChange(value === "null" ? null : value);
                    handleClinicChange(value);
                  }}
                  disabled={
                    isLoading || role === "ADMIN" || clinics.length === 0
                  }
                  options={[
                    { value: "null", label: "None (System User)" },
                    ...clinics
                      .filter((clinic) => clinic.isActive)
                      .map((clinic) => ({
                        value: clinic.id,
                        label: clinic.name,
                      })),
                  ]}
                />
              </FormControl>
              <FormDescription>
                {role === "ADMIN"
                  ? "System admins are not assigned to a specific clinic"
                  : "Select the clinic this user belongs to"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  When inactive, user cannot log in to the system
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2" size="sm" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
