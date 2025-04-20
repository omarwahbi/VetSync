"use client";

import { useState } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, User, Building2, Search } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the clinic interface
interface Clinic {
  id: string;
  name: string;
}

// Define the validation schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  clinicId: z.string({ required_error: "Please select a clinic" }),
});

// Define the form types
export type CreateUserFormValues = z.infer<typeof formSchema>;

// Define the form props
interface AdminCreateUserFormProps {
  clinics: Clinic[];
  onSubmit: (data: CreateUserFormValues) => void;
  isLoading: boolean;
}

export function AdminCreateUserForm({
  clinics,
  onSubmit,
  isLoading,
}: AdminCreateUserFormProps) {
  // Set up form with default values
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      clinicId: "",
    },
  });

  // Add state for clinic search
  const [clinicSearchQuery, setClinicSearchQuery] = useState("");

  // Handle form submission
  const handleSubmit = (values: CreateUserFormValues) => {
    onSubmit(values);
  };

  // Ensure clinics is an array before filtering
  const clinicArray = Array.isArray(clinics) ? clinics : [];

  // Filter clinics based on search query
  const filteredClinics = clinicArray.filter((clinic) => {
    if (!clinic || typeof clinic !== "object") return false;
    return (
      clinic.name?.toLowerCase().includes(clinicSearchQuery.toLowerCase()) ||
      false
    );
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({
            field,
          }: {
            field: ControllerRenderProps<CreateUserFormValues, "email">;
          }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@clinic.com"
                  autoComplete="email"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                This email will be used for login
              </FormDescription>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({
            field,
          }: {
            field: ControllerRenderProps<CreateUserFormValues, "password">;
          }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Password</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="********"
                  autoComplete="new-password"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Minimum 8 characters long
              </FormDescription>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<CreateUserFormValues, "firstName">;
            }) => (
              <FormItem className="space-y-2">
                <FormLabel className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">First Name</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="First name"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({
              field,
            }: {
              field: ControllerRenderProps<CreateUserFormValues, "lastName">;
            }) => (
              <FormItem className="space-y-2">
                <FormLabel className="flex items-center gap-1">
                  <span className="text-sm font-medium">Last Name</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Last name"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clinicId"
          render={({
            field,
          }: {
            field: ControllerRenderProps<CreateUserFormValues, "clinicId">;
          }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Assign to Clinic</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a clinic" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="w-full">
                  <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      placeholder="Search clinics..."
                      className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      value={clinicSearchQuery}
                      onChange={(e) => setClinicSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredClinics.length > 0 ? (
                      filteredClinics.map((clinic) => (
                        <SelectItem
                          key={clinic.id}
                          value={clinic.id}
                          className="flex py-2"
                        >
                          {clinic.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-6 text-center text-sm">
                        No clinics available
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs text-muted-foreground">
                The user will be assigned to this clinic as a staff member
              </FormDescription>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
