"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
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
import { ResponsiveForm } from "@/components/ui/responsive-form";

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
  const t = useTranslations("OwnerForm");
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  // Get clinic reminder settings from auth store
  const clinicCanSendReminders = useAuthStore(
    (state) => state.user?.clinic?.canSendReminders ?? false
  );

  // Create validation schema with translated error messages
  const ownerSchema = createOwnerSchema({
    firstNameRequired: t("firstNameRequired"),
    lastNameRequired: t("lastNameRequired"),
    invalidEmail: t("invalidEmail"),
    invalidPhone: t("invalidPhone"),
    phoneRequired: t("phoneRequired"),
    addressTooLong: t("addressTooLong"),
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
      <ResponsiveForm
        id="owner-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        dir={isRTL ? "rtl" : "ltr"}
        footer={
          !hideButtons && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                {t("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t("save")}
              </Button>
            </div>
          )
        }
      >
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("firstName")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("firstNamePlaceholder")}
                  {...field}
                  className={isRTL ? "text-right" : "text-left"}
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
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("lastName")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("lastNamePlaceholder")}
                  {...field}
                  className={isRTL ? "text-right" : "text-left"}
                />
              </FormControl>
              <FormMessage />
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
                {t("email")}
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                  value={field.value || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    field.onChange(value);
                  }}
                  className={isRTL ? "text-right" : "text-left"}
                />
              </FormControl>
              <FormMessage />
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
                {t("phoneNumber")} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  {...field}
                  className={isRTL ? "text-right" : "text-left"}
                />
              </FormControl>
              <FormMessage />
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
                {t("address")}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("addressPlaceholder")}
                  {...field}
                  value={field.value || ""}
                  className={`resize-none min-h-[80px] ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowAutomatedReminders"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!clinicCanSendReminders}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t("allowReminders")}
                </FormLabel>
                <FormDescription>{t("allowRemindersDesc")}</FormDescription>
              </div>
            </FormItem>
          )}
        />
      </ResponsiveForm>
    </Form>
  );
}
