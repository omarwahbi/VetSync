"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
  isActive: z.boolean().default(true),
  canSendReminders: z.boolean().default(false),
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
                  Enable to activate this clinic immediately
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
                  Allow this clinic to send automated reminders
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
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
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
