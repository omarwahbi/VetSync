"use client";

import { useForm, ControllerRenderProps } from "react-hook-form";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define validation schema
const clinicProfileSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .min(1, "Phone number is required"),
});

export type ClinicProfileFormValues = z.infer<typeof clinicProfileSchema>;

interface ClinicProfileFormProps {
  initialData?: ClinicProfileFormValues;
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
  const form = useForm<ClinicProfileFormValues>({
    resolver: zodResolver(clinicProfileSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
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
              <FormLabel className="">Clinic Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter clinic name"
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
              <FormLabel className="">Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter clinic address"
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
              <FormLabel className="">Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter phone number"
                  className=""
                  type="tel"
                  {...field}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
