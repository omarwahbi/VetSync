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
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  canSendReminders: z.boolean(),
  subscriptionEndDate: z.date().nullable().optional(),
});

// Define the form types
export type CreateClinicFormValues = z.infer<typeof formSchema>;

// Define the form props
interface AdminCreateClinicFormProps {
  onSubmit: (data: CreateClinicFormValues) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function AdminCreateClinicForm({
  onSubmit,
  onClose,
  isLoading,
}: AdminCreateClinicFormProps) {
  // Set up form with default values
  const form = useForm<CreateClinicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      isActive: true,
      canSendReminders: false,
      subscriptionEndDate: null,
    },
  });

  // Handle form submission
  const handleSubmit = (values: CreateClinicFormValues) => {
    onSubmit(values);
  };

  // Clear the subscription end date
  const handleClearDate = () => {
    form.setValue("subscriptionEndDate", null);
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
                <Input placeholder="Enter clinic name" {...field} />
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
                <Input placeholder="Enter clinic address" {...field} />
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
                <Input placeholder="Enter phone number" {...field} />
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
                  Enable this clinic to allow users to log in and use the
                  system.
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
                <FormLabel>Enable Reminders</FormLabel>
                <FormDescription>
                  Allow this clinic to send email reminders to clients about
                  upcoming appointments.
                </FormDescription>
              </div>
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
                          format(field.value, "dd-MM-yyyy")
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Clinic"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
