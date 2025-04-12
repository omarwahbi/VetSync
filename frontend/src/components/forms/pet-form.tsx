"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Calendar as CalendarIcon, Search } from "lucide-react";
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

// Define interfaces for Owner and Pet
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
  ownerId: z.string().min(1, { message: "Owner is required" }),
  notes: z.string().optional(),
});

export type PetFormValues = z.infer<typeof petSchema>;

interface PetFormProps {
  initialData?: PetFormValues;
  onSubmit: (data: PetFormValues) => void;
  onClose: () => void;
  owners: Owner[];
  isLoading?: boolean;
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
}: PetFormProps) {
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: initialData || {
      name: "",
      species: "",
      breed: "",
      birthDate: null,
      gender: "",
      ownerId: "",
      notes: "",
    },
  });

  const handleSubmit = (data: PetFormValues) => {
    onSubmit(data);
  };

  // Filter owners based on search query
  const filteredOwners = owners.filter((owner) => {
    const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
    return fullName.includes(ownerSearchQuery.toLowerCase());
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Owner Selection with Search */}
        <FormField
          control={form.control}
          name="ownerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Owner <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an owner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
                        <SelectItem key={owner.id} value={owner.id}>
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pet Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Pet's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Species */}
        <FormField
          control={form.control}
          name="species"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Species <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {speciesOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Breed */}
        <FormField
          control={form.control}
          name="breed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Breed</FormLabel>
              <FormControl>
                <Input
                  placeholder="Breed"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Birth Date */}
        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Birth Date</FormLabel>
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
                        <span>Pick a date</span>
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input
                  placeholder="Additional notes"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
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
              "Save Pet"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
