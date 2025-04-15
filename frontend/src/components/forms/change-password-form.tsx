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
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  onSubmit: (data: ChangePasswordFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ChangePasswordForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: ChangePasswordFormProps) {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const handleSubmit = (data: ChangePasswordFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Current Password */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({
            field,
          }: {
            field: ControllerRenderProps<
              ChangePasswordFormValues,
              "currentPassword"
            >;
          }) => (
            <FormItem className="">
              <FormLabel className="">Current Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter current password"
                  className=""
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        {/* New Password */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({
            field,
          }: {
            field: ControllerRenderProps<
              ChangePasswordFormValues,
              "newPassword"
            >;
          }) => (
            <FormItem className="">
              <FormLabel className="">New Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter new password"
                  className=""
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        {/* Confirm New Password */}
        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({
            field,
          }: {
            field: ControllerRenderProps<
              ChangePasswordFormValues,
              "confirmNewPassword"
            >;
          }) => (
            <FormItem className="">
              <FormLabel className="">Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Confirm new password"
                  className=""
                  type="password"
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
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
