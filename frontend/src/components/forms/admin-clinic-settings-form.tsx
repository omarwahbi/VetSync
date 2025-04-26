"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addMonths, addYears } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Define the validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
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
              <FormLabel>Clinic Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Enter clinic name"
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Enter clinic address"
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
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  className="w-full"
                  placeholder="Enter phone number"
                  {...field}
                />
              </FormControl>
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
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Toggle to enable or disable this clinic
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
                <FormLabel>Can Send Reminders</FormLabel>
                <FormDescription>
                  This is a system-level toggle that overrides the reminder
                  limit setting. If disabled, the clinic cannot send any
                  reminders regardless of the limit set below.
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
              <FormLabel>Monthly Reminder Limit</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="w-full"
                  placeholder="Enter limit (-1 for unlimited, 0 to disable)"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value, 10)
                      : -1;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Set to -1 for unlimited reminders, 0 to disable reminders, or
                enter a numeric limit per cycle. Note: This setting only applies
                if &quot;Can Send Reminders&quot; is enabled above.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Reminder Cycle Info (Read-only) */}
        <div className="rounded-md border p-4 space-y-2">
          <h3 className="font-semibold text-sm">
            Current Reminder Cycle Information
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Cycle Start Date:</p>
              <p className="font-medium">
                {initialData.currentCycleStartDate
                  ? format(
                      new Date(initialData.currentCycleStartDate),
                      "MMM d, yyyy"
                    )
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                Reminders Sent This Cycle:
              </p>
              <p className="font-medium">
                {initialData.reminderSentThisCycle !== undefined
                  ? initialData.reminderSentThisCycle
                  : "N/A"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This information is updated automatically at the beginning of each
            subscription cycle.
          </p>
        </div>

        <FormField
          control={form.control}
          name="subscriptionStartDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Subscription Start Date</FormLabel>
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
                          format(field.value, "PPP")
                        ) : (
                          <span>No start date</span>
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
                    Clear
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
              <FormLabel>Subscription End Date</FormLabel>
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
                          format(field.value, "PPP")
                        ) : (
                          <span>No end date</span>
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
                    Clear
                  </Button>
                )}
              </div>

              {/* Subscription Plan Options */}
              <div className="flex flex-col space-y-2 mt-2">
                <FormDescription>Quick Subscription Plans</FormDescription>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlanSelection(1)}
                  >
                    1 Month
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlanSelection(6)}
                  >
                    6 Months
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlanSelection(12)}
                  >
                    1 Year
                  </Button>
                </div>
              </div>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
