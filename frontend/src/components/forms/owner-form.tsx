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

// Define validation schema
const ownerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .union([z.string().email("Invalid email format"), z.string().length(0)])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .min(1, "Phone number is required"),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional(),
  allowAutomatedReminders: z.boolean(),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;

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
                <Input placeholder="John" {...field} />
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
                <Input placeholder="Doe" {...field} />
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
                Email (Optional)
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
                <Input placeholder="+1 (555) 123-4567" {...field} />
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
                Address (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter owner address..."
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
                    ? "Allow this owner to receive automated reminders (if enabled for the specific visit)."
                    : "Automated reminders are currently disabled for this clinic's subscription plan."}
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Owner
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
