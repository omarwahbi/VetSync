"use client";

import { useForm, ControllerRenderProps } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth";

// Define validation schema
const clinicProfileSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .min(1, "Phone number is required"),
  timezone: z.string().optional(),
});

export type ClinicProfileFormValues = z.infer<typeof clinicProfileSchema>;

interface ClinicProfileFormProps {
  initialData?: {
    name: string;
    address: string;
    phone: string;
    timezone?: string;
  };
  onSave: (data: ClinicProfileFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClinicProfileForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: ClinicProfileFormProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const isClinicAdmin = user?.role === "CLINIC_ADMIN";
  const canEditTimezone = isAdmin || isClinicAdmin;
  const t = useTranslations("ClinicProfile");
  const commonT = useTranslations("Common");

  const form = useForm<ClinicProfileFormValues>({
    resolver: zodResolver(clinicProfileSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
      timezone: initialData?.timezone || "UTC",
    },
  });

  const handleSubmit = (data: ClinicProfileFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({
            field,
          }: {
            field: ControllerRenderProps<ClinicProfileFormValues, "name">;
          }) => (
            <FormItem className="">
              <FormLabel className="">{t("clinicName")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("clinicName")}
                  className=""
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({
            field,
          }: {
            field: ControllerRenderProps<ClinicProfileFormValues, "address">;
          }) => (
            <FormItem className="">
              <FormLabel className="">{t("clinicAddress")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("clinicAddress")}
                  className=""
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({
            field,
          }: {
            field: ControllerRenderProps<ClinicProfileFormValues, "phone">;
          }) => (
            <FormItem className="">
              <FormLabel className="">{t("clinicPhone")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("clinicPhone")}
                  className=""
                  type="tel"
                  {...field}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        {/* Show timezone field for ADMIN and CLINIC_ADMIN users */}
        {canEditTimezone && (
          <FormField
            control={form.control}
            name="timezone"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ClinicProfileFormValues, "timezone">;
            }) => (
              <FormItem>
                <FormLabel>{t("clinicTimezone")}</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="">
                      <SelectValue placeholder={t("clinicTimezone")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="">
                    <SelectItem className="" value="UTC">
                      UTC
                    </SelectItem>
                    <SelectItem className="" value="America/New_York">
                      America/New_York (UTC-5/4)
                    </SelectItem>
                    <SelectItem className="" value="America/Los_Angeles">
                      America/Los_Angeles (UTC-8/7)
                    </SelectItem>
                    <SelectItem className="" value="Europe/London">
                      Europe/London (UTC+0/1)
                    </SelectItem>
                    <SelectItem className="" value="Asia/Dubai">
                      Asia/Dubai (UTC+4)
                    </SelectItem>
                    <SelectItem className="" value="Asia/Baghdad">
                      Asia/Baghdad (UTC+3)
                    </SelectItem>
                    <SelectItem className="" value="Asia/Tokyo">
                      Asia/Tokyo (UTC+9)
                    </SelectItem>
                    <SelectItem className="" value="Australia/Sydney">
                      Australia/Sydney (UTC+10/11)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t("clinicTimezoneDescription") ||
                    "Determines the clinic's operational 'day' for stats/reminders."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {commonT("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving") || "Saving..."}
              </>
            ) : (
              commonT("save")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
