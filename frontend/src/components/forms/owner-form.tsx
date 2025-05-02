"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Bell,
  Save,
  X,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Define validation schema creator with hard-coded fallbacks
const createOwnerSchema = (errorMessages: Record<string, string>) =>
  z.object({
    firstName: z
      .string()
      .min(1, errorMessages.firstNameRequired || "First name is required"),
    lastName: z
      .string()
      .min(1, errorMessages.lastNameRequired || "Last name is required"),
    email: z
      .union([
        z.string().email(errorMessages.invalidEmail || "Invalid email format"),
        z.string().length(0),
      ])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    phone: z
      .string()
      .regex(
        /^[0-9+\-\s()]*$/,
        errorMessages.invalidPhone || "Invalid phone number format"
      )
      .min(1, errorMessages.phoneRequired || "Phone number is required"),
    address: z
      .string()
      .max(
        500,
        errorMessages.addressTooLong ||
          "Address must be less than 500 characters"
      )
      .optional(),
    allowAutomatedReminders: z.boolean(),
  });

export type OwnerFormValues = z.infer<ReturnType<typeof createOwnerSchema>>;

interface OwnerFormProps {
  initialData?: Partial<OwnerFormValues>;
  onSubmit: (data: OwnerFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
  hideButtons?: boolean;
}

export function OwnerForm({
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
  hideButtons = false,
}: OwnerFormProps) {
  // Get clinic reminder settings from auth store
  const clinicCanSendReminders = useAuthStore(
    (state) => state.user?.clinic?.canSendReminders ?? false
  );

  // Create validation schema with error messages
  const ownerSchema = createOwnerSchema({
    firstNameRequired: "First name is required",
    lastNameRequired: "Last name is required",
    invalidEmail: "Invalid email format",
    invalidPhone: "Invalid phone number format",
    phoneRequired: "Phone number is required",
    addressTooLong: "Address must be less than 500 characters",
  });

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email:
        initialData?.email === null || initialData?.email === undefined
          ? ""
          : initialData.email,
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      allowAutomatedReminders:
        initialData?.allowAutomatedReminders !== undefined
          ? initialData.allowAutomatedReminders
          : true,
    },
  });

  const handleSubmit = (data: OwnerFormValues) => {
    // Remove undefined fields before submitting
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    onSubmit(payload as OwnerFormValues);
  };

  return (
    <Form {...form}>
      <form
        id="owner-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name
              </FormLabel>
              <FormControl>
                <Input placeholder="Mohammad" {...field} />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name
              </FormLabel>
              <FormControl>
                <Input placeholder="Ahmad" {...field} />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                  value={field.value || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="07xx xxx xxx" {...field} />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter client's address"
                  {...field}
                  className="resize-none min-h-[80px]"
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowAutomatedReminders"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={!clinicCanSendReminders}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel
                  className={`flex items-center gap-2 ${
                    !clinicCanSendReminders ? "text-muted-foreground" : ""
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  Allow Automated Reminders
                </FormLabel>
                <FormDescription className="text-sm text-muted-foreground">
                  {clinicCanSendReminders
                    ? "Allow sending automated appointment reminders to this client via email or SMS"
                    : "Reminders are disabled for your clinic. Contact admin to enable."}
                </FormDescription>
              </div>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {!hideButtons && (
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
