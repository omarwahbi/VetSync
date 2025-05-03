"use client";

import { useForm, ControllerRenderProps } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  onSave: (data: ProfileFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProfileForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: ProfileFormProps) {
  const t = useTranslations("Profile");
  const commonT = useTranslations("Common");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
    },
  });

  const handleSubmit = (data: ProfileFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm font-medium mb-2">
            {t("personalInformation")}
          </div>

          <FormField
            control={form.control}
            name="firstName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ProfileFormValues, "firstName">;
            }) => (
              <FormItem>
                <FormLabel>{t("firstName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("firstName")} type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ProfileFormValues, "lastName">;
            }) => (
              <FormItem>
                <FormLabel>{t("lastName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("lastName")} type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
