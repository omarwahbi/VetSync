"use client";

import { useState } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Calendar as CalendarIcon,
  Search,
  User,
  Cat,
  Dog,
  Users,
  FileText,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// Define interfaces for Owner
interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Define validation schema
const petSchema = z.object({
  name: z.string().min(1, { message: "Pet name is required" }),
  species: z.string().min(1, { message: "Species is required" }),
  breed: z.string().optional(),
  birthDate: z.date().optional().nullable(),
  gender: z.string().optional(),
  ownerId: z.string().optional(), // Make ownerId optional since it might be passed via props
  notes: z.string().optional(),
});

export type PetFormValues = z.infer<typeof petSchema>;

interface PetFormProps {
  initialData?: Partial<PetFormValues>;
  onSubmit: (data: PetFormValues) => void;
  onClose: () => void;
  owners: Owner[];
  isLoading?: boolean;
  ownerId?: string; // Optional owner ID - when provided, owner selection is hidden
  hideButtons?: boolean; // Optional prop to hide form buttons when used in wizard
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown", label: "Unknown" },
];

const speciesOptions = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "rabbit", label: "Rabbit" },
  { value: "other", label: "Other" },
];

export function PetForm({
  initialData,
  onSubmit,
  onClose,
  owners,
  isLoading = false,
  ownerId,
  hideButtons = false,
}: PetFormProps) {
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");

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
  const filteredOwners = owners.filter((owner) => {
    const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
    return fullName.includes(ownerSearchQuery.toLowerCase());
  });

  return (
    <Form {...form}>
      <form
        id="pet-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
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
                <FormLabel className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Owner <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an owner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full">
                    <div className="flex items-center border-b px-3 py-2">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        placeholder="Search owners..."
                        className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="flex py-2"
                          >
                            {owner.firstName} {owner.lastName}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm">
                          No owners found
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage className="w-full" />
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
              <FormLabel className="flex items-center gap-1">
                <Cat className="h-4 w-4" />
                Pet&apos;s name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl className="w-full">
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Pet's name"
                  {...field}
                />
              </FormControl>
              <FormMessage className="w-full" />
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
              <FormLabel className="flex items-center gap-1">
                <Dog className="h-4 w-4" />
                Species <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[200px]">
                  {speciesOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-2"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="w-full" />
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
              <FormLabel className="flex items-center gap-1">
                <Cat className="h-4 w-4" />
                Breed
              </FormLabel>
              <FormControl className="w-full">
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Breed"
                  {...field}
                />
              </FormControl>
              <FormMessage className="w-full" />
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
              <FormLabel className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                Birth Date
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl className="w-full">
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal w-full",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage className="w-full" />
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
              <FormLabel className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Gender
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[200px]">
                  {genderOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-2"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="w-full" />
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
              <FormLabel className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Notes
              </FormLabel>
              <FormControl className="w-full">
                <Textarea
                  placeholder="Any additional notes"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="w-full" />
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
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Pet
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
