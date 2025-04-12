"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

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

// Define validation schema
const ownerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .union([
      z.string().email("Invalid email format"),
      z.string().length(0),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === "" ? null : val)),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .min(1, "Phone number is required"),
  allowAutomatedReminders: z.boolean().default(true),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;

interface OwnerFormProps {
  initialData?: Partial<OwnerFormValues>;
  onSubmit: (data: OwnerFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function OwnerForm({
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}: OwnerFormProps) {
  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email === null ? "" : initialData?.email || "",
      phone: initialData?.phone || "",
      allowAutomatedReminders:
        initialData?.allowAutomatedReminders !== undefined
          ? initialData.allowAutomatedReminders
          : true,
    },
  });

  const handleSubmit = async (data: OwnerFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
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
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? null : value);
                  }}
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
              <FormLabel>
                Phone Number <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 (555) 123-4567"
                  {...field}
                  value={field.value || ""}
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
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Allow Automated Reminders</FormLabel>
                <FormDescription>
                  Send automated reminders to this owner for upcoming pet
                  visits.
                </FormDescription>
              </div>
              <FormMessage />
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
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Owner"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
