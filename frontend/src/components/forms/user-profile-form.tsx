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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define validation schema
const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format").min(1, "Email is required"),
});

export type UserProfileFormValues = z.infer<typeof userProfileSchema>;

interface UserProfileFormProps {
  initialData?: UserProfileFormValues;
  onSave: (data: UserProfileFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserProfileForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: UserProfileFormProps) {
  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
    },
  });

  const handleSubmit = (data: UserProfileFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({
            field,
          }: {
            field: ControllerRenderProps<UserProfileFormValues, "firstName">;
          }) => (
            <FormItem className="">
              <FormLabel className="">First Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter first name"
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
          name="lastName"
          render={({
            field,
          }: {
            field: ControllerRenderProps<UserProfileFormValues, "lastName">;
          }) => (
            <FormItem className="">
              <FormLabel className="">Last Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter last name"
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
          name="email"
          render={({
            field,
          }: {
            field: ControllerRenderProps<UserProfileFormValues, "email">;
          }) => (
            <FormItem className="">
              <FormLabel className="">Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter email"
                  className=""
                  type="email"
                  disabled
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground mt-1">
                Email cannot be changed. Contact support if you need to update
                your email.
              </FormDescription>
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
