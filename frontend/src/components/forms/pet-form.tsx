"use client";

import * as React from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  Dog,
  FileText,
  Loader2,
  Save,
  Users,
  X,
  Search,
  User,
  Cat,
  Bird,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SingleDatePicker } from "@/components/ui/single-date-picker";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

// Define interfaces for Owner
interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Define validation schema creator with translated error messages
const createPetSchema = (errorMessages: Record<string, string>) =>
  z.object({
    name: z.string().min(1, {
      message: errorMessages.nameRequired || "Pet name is required",
    }),
    species: z.string().min(1, {
      message: errorMessages.speciesRequired || "Species is required",
    }),
    breed: z.string().optional(),
    birthDate: z.date().optional().nullable(),
    gender: z.string().optional(),
    ownerId: z.string().optional(), // Make ownerId optional since it might be passed via props
    notes: z.string().optional(),
  });

export type PetFormValues = z.infer<ReturnType<typeof createPetSchema>>;

interface PetFormProps {
  initialData?: Partial<PetFormValues>;
  onSubmit: (data: PetFormValues) => void;
  onClose: () => void;
  owners: Owner[];
  isLoading?: boolean;
  ownerId?: string; // Optional owner ID - when provided, owner selection is hidden
  hideButtons?: boolean; // Optional prop to hide form buttons when used in wizard
}

export function PetForm({
  initialData,
  onSubmit,
  onClose,
  owners,
  isLoading = false,
  ownerId,
  hideButtons = false,
}: PetFormProps) {
  const t = useTranslations("PetForm");
  const commonT = useTranslations("Common");
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  const [ownerSearchQuery, setOwnerSearchQuery] = React.useState("");

  // Create gender and species options with translated strings
  const genderOptions = [
    { value: "male", label: t("genderOptions.male"), icon: Users },
    { value: "female", label: t("genderOptions.female"), icon: Users },
    { value: "unknown", label: t("genderOptions.unknown"), icon: Users },
  ];

  const speciesOptions = [
    { value: "dog", label: t("speciesOptions.dog"), icon: Dog },
    { value: "cat", label: t("speciesOptions.cat"), icon: Cat },
    { value: "bird", label: t("speciesOptions.bird"), icon: Bird },
    { value: "other", label: t("speciesOptions.other"), icon: FileText },
  ];

  // Create validation schema with translated error messages
  const petSchema = createPetSchema({
    nameRequired: t("nameRequired"),
    speciesRequired: t("speciesRequired"),
  });

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: initialData?.name || "",
      species: initialData?.species || "",
      breed: initialData?.breed || "",
      birthDate: initialData?.birthDate || null,
      gender: initialData?.gender || "",
      ownerId: ownerId || initialData?.ownerId || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (data: PetFormValues) => {
    // Ensure the form data includes the ownerId if provided via props
    onSubmit({
      ...data,
      ownerId: ownerId || data.ownerId,
    });
  };

  // Filter owners based on search query
  const filteredOwners = Array.isArray(owners)
    ? owners.filter((owner) => {
        const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
        return fullName.includes(ownerSearchQuery.toLowerCase());
      })
    : [];

  return (
    <Form {...form}>
      <form
        id="pet-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Owner Selection - Only show if ownerId prop is not provided */}
        {!ownerId && (
          <FormField
            control={form.control}
            name="ownerId"
            render={({
              field,
            }: {
              field: ControllerRenderProps<PetFormValues, "ownerId">;
            }) => (
              <FormItem className="w-full">
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("owner")} <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger
                      className={`w-full ${isRTL ? "text-right" : "text-left"}`}
                    >
                      <SelectValue placeholder={t("selectOwner")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full">
                    <div className="flex items-center border-b px-3 py-2">
                      <Search
                        className={`${
                          isRTL ? "ml-2" : "mr-2"
                        } h-4 w-4 shrink-0 opacity-50`}
                      />
                      <input
                        placeholder={t("searchOwner")}
                        className={`flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                        value={ownerSearchQuery}
                        onChange={(e) => setOwnerSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredOwners.length > 0 ? (
                        filteredOwners.map((owner) => (
                          <SelectItem
                            key={owner.id}
                            value={owner.id}
                            className={`flex py-2 ${
                              isRTL ? "text-right" : "text-left"
                            }`}
                          >
                            {owner.firstName} {owner.lastName}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm">
                          {t("noOwnersFound")}
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage className={isRTL ? "text-right" : "text-left"} />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({
            field,
          }: {
            field: ControllerRenderProps<PetFormValues, "name">;
          }) => (
            <FormItem className="w-full">
              <FormLabel className="flex items-center gap-2">
                <Cat className="h-4 w-4" />
                {t("petName")} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl className="w-full">
                <Input
                  type="text"
                  className={`w-full ${isRTL ? "text-right" : "text-left"}`}
                  placeholder={t("petNamePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="species"
          render={({
            field,
          }: {
            field: ControllerRenderProps<PetFormValues, "species">;
          }) => (
            <FormItem className="w-full">
              <FormLabel className="flex items-center gap-2">
                <Dog className="h-4 w-4" />
                {t("species")} <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger
                    className={`w-full ${isRTL ? "text-right" : "text-left"}`}
                  >
                    <SelectValue placeholder={t("selectSpecies")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="w-full">
                  {speciesOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={isRTL ? "text-right" : "text-left"}
                    >
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="breed"
          render={({
            field,
          }: {
            field: ControllerRenderProps<PetFormValues, "breed">;
          }) => (
            <FormItem className="w-full">
              <FormLabel className="flex items-center gap-2">
                <Dog className="h-4 w-4" />
                {t("breed")}
              </FormLabel>
              <FormControl className="w-full">
                <Input
                  type="text"
                  className={`w-full ${isRTL ? "text-right" : "text-left"}`}
                  placeholder={t("breedPlaceholder")}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({
            field,
          }: {
            field: ControllerRenderProps<PetFormValues, "gender">;
          }) => (
            <FormItem className="w-full">
              <FormLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("gender")}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger
                    className={`w-full ${isRTL ? "text-right" : "text-left"}`}
                  >
                    <SelectValue placeholder={t("selectGender")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="w-full">
                  {genderOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={isRTL ? "text-right" : "text-left"}
                    >
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthDate"
          render={({
            field,
          }: {
            field: ControllerRenderProps<PetFormValues, "birthDate">;
          }) => (
            <FormItem className="w-full">
              <FormLabel className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {t("birthDate")}
              </FormLabel>
              <FormControl>
                <SingleDatePicker
                  date={field.value || undefined}
                  onChange={field.onChange}
                  maxDate={new Date()}
                  minDate={new Date("1900-01-01")}
                  placeholder={t("selectDate")}
                />
              </FormControl>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({
            field,
          }: {
            field: ControllerRenderProps<PetFormValues, "notes">;
          }) => (
            <FormItem className="w-full">
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("notes")}
              </FormLabel>
              <FormControl className="w-full">
                <Textarea
                  placeholder={t("notesPlaceholder")}
                  {...field}
                  value={field.value || ""}
                  className={`w-full resize-none min-h-[100px] ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                />
              </FormControl>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
            </FormItem>
          )}
        />

        {!hideButtons && (
          <div
            className={`flex ${
              isRTL ? "justify-start" : "justify-end"
            } gap-2 pt-4`}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2
                    className={`h-4 w-4 animate-spin ${
                      isRTL ? "ml-2" : "mr-2"
                    }`}
                  />
                  {commonT("saving")}
                </>
              ) : (
                <>
                  <Save className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {initialData ? t("updatePet") : t("savePet")}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
