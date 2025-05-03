"use client";

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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "next-intl";

// Define the form schema with zod
const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Define the form values type from the schema
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface ClinicCreateUserFormProps {
  onSubmit: (data: FormValues) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function ClinicCreateUserForm({
  onSubmit,
  onClose,
  isLoading,
}: ClinicCreateUserFormProps) {
  const t = useTranslations("ManageUsers");

  // Initialize the form with react-hook-form and zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    // Clean up empty strings to be undefined
    const cleanValues = {
      ...values,
      firstName: values.firstName?.trim() || undefined,
      lastName: values.lastName?.trim() || undefined,
    };
    onSubmit(cleanValues);
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
              <FormLabel>{t("email")}*</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("emailPlaceholder")}
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}*</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
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
              <LoadingSpinner size="sm" text={t("creating")} />
            ) : (
              t("createUser")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
