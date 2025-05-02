"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addMonths, addYears } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
  canSendReminders: z.boolean().optional(),
  subscriptionStartDate: z.date().nullable().optional(),
  subscriptionEndDate: z.date().nullable().optional(),
  reminderMonthlyLimit: z.number().min(-1).optional(),
});

// Define the form props
interface AdminClinicSettingsFormProps {
  initialData: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    timezone?: string;
    isActive: boolean;
    canSendReminders: boolean;
    subscriptionStartDate?: string | null;
    subscriptionEndDate?: string | null;
    reminderMonthlyLimit?: number;
    reminderSentThisCycle?: number;
    currentCycleStartDate?: string | null;
  };
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function AdminClinicSettingsForm({
  initialData,
  onSubmit,
  onClose,
  isLoading,
}: AdminClinicSettingsFormProps) {
  // Get translations
  const t = useTranslations("AdminClinicSettings");

  // Parse dates
  const parsedSubscriptionEndDate = initialData.subscriptionEndDate
    ? new Date(initialData.subscriptionEndDate)
    : null;

  const parsedSubscriptionStartDate = initialData.subscriptionStartDate
    ? new Date(initialData.subscriptionStartDate)
    : null;

  // Set up form with default values from initialData
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      address: initialData.address || "",
      phone: initialData.phone || "",
      timezone: initialData.timezone || "UTC",
      isActive: initialData.isActive,
      canSendReminders: initialData.canSendReminders,
      subscriptionStartDate: parsedSubscriptionStartDate,
      subscriptionEndDate: parsedSubscriptionEndDate,
      reminderMonthlyLimit: initialData.reminderMonthlyLimit ?? -1,
    },
  });

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  // Clear the subscription end date
  const handleClearDate = () => {
    form.setValue("subscriptionEndDate", null);
  };

  // Clear the subscription start date
  const handleClearStartDate = () => {
    form.setValue("subscriptionStartDate", null);
  };

  // Handle subscription plan selection
  const handlePlanSelection = (months: number) => {
    const today = new Date();
    const newEndDate =
      months === 12
        ? addYears(today, 1) // 1 year
        : addMonths(today, months); // 1 or 6 months
    form.setValue("subscriptionEndDate", newEndDate);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("clinicName")}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="w-full"
                  placeholder={t("enterClinicName")}
                  {...field}
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
            <FormItem>
              <FormLabel>{t("address")}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="w-full"
                  placeholder={t("enterClinicAddress")}
                  {...field}
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
            <FormItem>
              <FormLabel>{t("phoneNumber")}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  className="w-full"
                  placeholder={t("enterPhoneNumber")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("clinicTimezone")}</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectTimezone")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-80">
                  <SelectItem className="cursor-pointer" value="UTC">
                    UTC
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer"
                    value="America/New_York"
                  >
                    America/New_York (UTC-5/4)
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer"
                    value="America/Los_Angeles"
                  >
                    America/Los_Angeles (UTC-8/7)
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="Europe/London">
                    Europe/London (UTC+0/1)
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="Asia/Dubai">
                    Asia/Dubai (UTC+4)
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="Asia/Baghdad">
                    Asia/Baghdad (UTC+3)
                  </SelectItem>
                  <SelectItem className="cursor-pointer" value="Asia/Tokyo">
                    Asia/Tokyo (UTC+9)
                  </SelectItem>
                  <SelectItem
                    className="cursor-pointer"
                    value="Australia/Sydney"
                  >
                    Australia/Sydney (UTC+10/11)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t("timezoneDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t("activeStatus")}</FormLabel>
                <FormDescription>
                  {t("activeStatusDescription")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="canSendReminders"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t("canSendReminders")}</FormLabel>
                <FormDescription>
                  {t("canSendRemindersDescription")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reminderMonthlyLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("monthlyReminderLimit")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="w-full"
                  placeholder={t("enterReminderLimit")}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value, 10)
                      : -1;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>{t("reminderLimitDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Reminder Cycle Info (Read-only) */}
        <div className="rounded-md border p-4 space-y-2">
          <h3 className="font-semibold text-sm">
            {t("currentReminderCycleInfo")}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">{t("cycleStartDate")}:</p>
              <p className="font-medium">
                {initialData.currentCycleStartDate
                  ? format(
                      new Date(initialData.currentCycleStartDate),
                      "dd-MM-yyyy"
                    )
                  : t("notAvailable")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {t("remindersSentThisCycle")}:
              </p>
              <p className="font-medium">
                {initialData.reminderSentThisCycle !== undefined
                  ? initialData.reminderSentThisCycle
                  : t("notAvailable")}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("cycleInfoDescription")}
          </p>
        </div>

        <FormField
          control={form.control}
          name="subscriptionStartDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("subscriptionStartDate")}</FormLabel>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd-MM-yyyy")
                        ) : (
                          <span>{t("noStartDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {field.value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearStartDate}
                  >
                    {t("clear")}
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subscriptionEndDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("subscriptionEndDate")}</FormLabel>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd-MM-yyyy")
                        ) : (
                          <span>{t("noEndDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {field.value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDate}
                  >
                    {t("clear")}
                  </Button>
                )}
              </div>

              {/* Subscription Plan Options */}
              <div className="flex flex-col space-y-2 mt-2">
                <FormDescription>{t("quickSubscriptionPlans")}</FormDescription>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlanSelection(1)}
                  >
                    {t("oneMonth")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlanSelection(6)}
                  >
                    {t("sixMonths")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlanSelection(12)}
                  >
                    {t("oneYear")}
                  </Button>
                </div>
              </div>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("saving") : t("saveChanges")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
