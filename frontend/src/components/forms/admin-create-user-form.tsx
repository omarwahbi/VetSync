"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, User, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { DebouncedSelect } from "@/components/debug-tools";

// Define the clinic interface
interface Clinic {
  id: string;
  name: string;
}

// Define the validation schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  clinicId: z.string({ required_error: "Please select a clinic" }),
});

// Define the form types
export type CreateUserFormValues = z.infer<typeof formSchema>;

// Define the form props
interface AdminCreateUserFormProps {
  clinics: Clinic[];
  onSubmit: (data: CreateUserFormValues) => void;
  isLoading: boolean;
}

// Logging function to add timestamps
const log = (message: string, data?: unknown) => {
  console.log(
    `[${new Date().toISOString()}] AdminCreateUserForm: ${message}`,
    data || ""
  );
};

export function AdminCreateUserForm({
  clinics,
  onSubmit,
  isLoading,
}: AdminCreateUserFormProps) {
  log("Component rendering");

  // Get translations
  const t = useTranslations("AdminCreateUser");

  // Set up form with default values
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      clinicId: "",
    },
  });

  // Add state for clinic selection - use regular useState
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");

  // Log when component mounts and unmounts
  useEffect(() => {
    log("Component mounted");
    return () => log("Component unmounted");
  }, []);

  // Handle form submission
  const handleSubmit = (values: CreateUserFormValues) => {
    log("Form submitted", values);
    onSubmit(values);
  };

  // Handle clinic selection change with useCallback for memoization
  const handleClinicChange = useCallback(
    (value: string) => {
      log("handleClinicChange called with", value);

      // Guard against undefined or null values
      if (value === undefined || value === null) {
        log("Ignoring undefined/null clinic value");
        return;
      }

      setSelectedClinicId(value);

      // Only update the form if the value is different
      const currentValue = form.getValues("clinicId");
      if (currentValue !== value) {
        log("Updating form value clinicId to", value);
        form.setValue("clinicId", value, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
    [form]
  );

  // Ensure clinics is an array before filtering
  const clinicArray = Array.isArray(clinics) ? clinics : [];

  // Convert clinics to options format for DebouncedSelect
  const clinicOptions = clinicArray
    .filter((clinic) => clinic && typeof clinic === "object")
    .map((clinic) => ({
      value: clinic.id,
      label: clinic.name,
    }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Email field */}
        <FormField
          control={form.control}
          name="email"
          render={({
            field,
          }: {
            field: ControllerRenderProps<CreateUserFormValues, "email">;
          }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">{t("email")}</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                {t("emailDescription")}
              </FormDescription>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        {/* Password field */}
        <FormField
          control={form.control}
          name="password"
          render={({
            field,
          }: {
            field: ControllerRenderProps<CreateUserFormValues, "password">;
          }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">{t("password")}</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="new-password"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                {t("passwordDescription")}
              </FormDescription>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        {/* First name and last name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<CreateUserFormValues, "firstName">;
            }) => (
              <FormItem className="space-y-2">
                <FormLabel className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("firstName")}</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("firstNamePlaceholder")}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<CreateUserFormValues, "lastName">;
            }) => (
              <FormItem className="space-y-2">
                <FormLabel className="flex items-center gap-1">
                  <span className="text-sm font-medium">{t("lastName")}</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("lastNamePlaceholder")}
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />
        </div>

        {/* Clinic field - using DebouncedSelect */}
        <FormField
          control={form.control}
          name="clinicId"
          render={({
            field,
          }: {
            field: ControllerRenderProps<CreateUserFormValues, "clinicId">;
          }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("assignToClinic")}
                </span>
              </FormLabel>

              <DebouncedSelect
                label=""
                value={selectedClinicId || field.value}
                onValueChange={handleClinicChange}
                options={clinicOptions}
                disabled={isLoading}
                placeholder={t("selectClinic")}
                debounceMs={100}
              />

              <FormDescription className="text-xs text-muted-foreground">
                {t("clinicAssignmentDescription")}
              </FormDescription>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("creating") : t("createUser")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
