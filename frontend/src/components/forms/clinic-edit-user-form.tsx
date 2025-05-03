"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "next-intl";

// Define the user roles enum
enum UserRole {
  STAFF = "STAFF",
  CLINIC_ADMIN = "CLINIC_ADMIN",
}

// Define the form schema with zod
const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean(),
  // isAdmin is a boolean that controls whether to set role to CLINIC_ADMIN or STAFF
  isAdmin: z.boolean().optional(),
});

// Define the form values type from the schema
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface ClinicEditUserFormProps {
  initialData: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isActive: boolean;
  };
  onSubmit: (data: {
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    role?: string;
  }) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function ClinicEditUserForm({
  initialData,
  onSubmit,
  onClose,
  isLoading,
}: ClinicEditUserFormProps) {
  const t = useTranslations("ManageUsers");

  // Initialize form with initial values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      isActive: initialData.isActive,
      isAdmin: initialData.role === UserRole.CLINIC_ADMIN, // true if user is admin
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    form.reset({
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      isActive: initialData.isActive,
      isAdmin: initialData.role === UserRole.CLINIC_ADMIN,
    });
  }, [form, initialData]);

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    // Clean up empty strings to be undefined
    const cleanValues: {
      firstName?: string;
      lastName?: string;
      isActive: boolean;
      role?: string;
    } = {
      ...values,
      firstName: values.firstName?.trim() || undefined,
      lastName: values.lastName?.trim() || undefined,
      isActive: values.isActive,
    };

    // Handle role changes
    if (initialData.role === UserRole.STAFF && values.isAdmin) {
      // Promoting STAFF to CLINIC_ADMIN - set role explicitly
      cleanValues.role = UserRole.CLINIC_ADMIN;
    } else if (initialData.role === UserRole.STAFF && !values.isAdmin) {
      // Keeping as STAFF - don't set role
      cleanValues.role = undefined;
    } else if (initialData.role === UserRole.CLINIC_ADMIN) {
      // Cannot demote CLINIC_ADMIN - don't set role
      cleanValues.role = undefined;
    }

    onSubmit(cleanValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 mt-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("firstName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("firstNamePlaceholder")}
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
                <FormLabel>{t("lastName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("lastNamePlaceholder")}
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("status")}</FormLabel>
                <FormDescription>
                  {field.value ? t("active") : t("inactive")}
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

        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={
                    isLoading ||
                    (initialData.role === UserRole.CLINIC_ADMIN && field.value)
                  }
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t("clinicAdmin")}</FormLabel>
                <FormDescription>
                  {field.value
                    ? t("clinicAdminDescription")
                    : t("staffDescription")}
                </FormDescription>
                {initialData.role === UserRole.CLINIC_ADMIN && (
                  <p className="text-amber-600 text-sm mt-2">
                    {t("demoteAdminNote")}
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <LoadingSpinner size="sm" text={t("saving")} />
            ) : (
              t("saveChanges")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
