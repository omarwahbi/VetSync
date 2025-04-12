"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Visit } from "@/types/visit";

// Define validation schema
const visitSchema = z
  .object({
    visitDate: z.date({
      required_error: "Visit date is required",
    }),
    visitType: z.string().min(1, "Visit type is required"),
    notes: z.string().optional(),
    // Schema default is for new records, edited records use their own value
    isReminderEnabled: z.boolean().default(true),
    nextReminderDate: z.date().optional(),
  })
  .refine(
    (data) => {
      // If reminder is enabled, nextReminderDate must be provided
      return !data.isReminderEnabled || data.nextReminderDate !== undefined;
    },
    {
      message: "Next reminder date is required when reminder is enabled",
      path: ["nextReminderDate"],
    }
  );

// Visit types
const visitTypeOptions = [
  { value: "checkup", label: "Check-up" },
  { value: "vaccination", label: "Vaccination" },
  { value: "emergency", label: "Emergency" },
  { value: "surgery", label: "Surgery" },
  { value: "dental", label: "Dental" },
  { value: "grooming", label: "Grooming" },
  { value: "other", label: "Other" },
];

export type VisitFormValues = z.infer<typeof visitSchema>;

interface VisitFormProps {
  initialData?: VisitFormValues;
  onSubmit: (data: VisitFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function VisitForm({
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}: VisitFormProps) {
  // Log what we receive as initialData
  console.log("VisitForm received initialData:", initialData);

  // --- Refined Default Value Logic ---
  const defaultValuesForForm: Partial<VisitFormValues> = initialData
    ? {
        // Spread only the relevant fields you might want to default
        // Let RHF handle most defaults based on initialData structure if possible
        ...initialData,
        // Explicitly process dates as they need conversion
        visitDate:
          initialData.visitDate instanceof Date
            ? initialData.visitDate
            : new Date(),
        nextReminderDate:
          initialData.nextReminderDate instanceof Date
            ? initialData.nextReminderDate
            : undefined,
        // Explicitly set boolean, falling back to true if undefined in initialData
        isReminderEnabled: initialData.isReminderEnabled ?? true,
      }
    : {
        // Defaults for a NEW form
        visitDate: new Date(),
        visitType: "",
        notes: "",
        isReminderEnabled: true, // Zod default handles this too, but explicit is fine
        nextReminderDate: undefined,
      };
  // Add a log to verify right before passing to useForm
  console.log("Default values for form:", defaultValuesForForm);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    // Pass the explicitly constructed defaults
    defaultValues: defaultValuesForForm,
  });

  // Ensure visitDate is set on mount
  useEffect(() => {
    if (!form.getValues("visitDate")) {
      form.setValue("visitDate", new Date());
    }
  }, [form]);

  const handleSubmit = (data: VisitFormValues) => {
    // Ensure visitDate is a valid Date and nextReminderDate is properly handled
    const visitDate =
      data.visitDate instanceof Date ? data.visitDate : new Date();

    // Only include nextReminderDate if it's enabled and has a valid date
    const nextReminderDate =
      data.isReminderEnabled && data.nextReminderDate instanceof Date
        ? data.nextReminderDate
        : undefined;

    const submissionData = {
      ...data,
      visitDate,
      nextReminderDate,
    };
    onSubmit(submissionData);
  };

  // Reminder date helper functions
  const setReminderDate = (months: number = 0, years: number = 0) => {
    const today = new Date();
    let newDate = today;

    if (months > 0) {
      newDate = addMonths(today, months);
    } else if (years > 0) {
      newDate = addYears(today, years);
    }

    form.setValue("nextReminderDate", newDate);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="visitDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Visit Date</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value instanceof Date ? field.value : new Date()}
                  setDate={(date) => field.onChange(date || new Date())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visitType"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Visit Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visit type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {visitTypeOptions.map((option) => (
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional notes about the visit"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <FormLabel>Reminder Settings</FormLabel>
            <FormDescription>
              Configure the next reminder for this pet
            </FormDescription>
          </div>

          {/* Always show the next reminder date field, but validate based on isReminderEnabled */}
          <FormField
            control={form.control}
            name="nextReminderDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Next Reminder Date{" "}
                  {form.watch("isReminderEnabled") && (
                    <span className="text-red-500">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value instanceof Date ? field.value : undefined}
                    setDate={(date) => field.onChange(date)}
                  />
                </FormControl>
                <FormDescription>
                  {form.watch("isReminderEnabled")
                    ? "Required when reminder is enabled"
                    : "Optional when reminder is disabled"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quick reminder date buttons */}
          <div className="flex flex-wrap gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(1)}
            >
              +1 Month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(3)}
            >
              +3 Months
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(6)}
            >
              +6 Months
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(0, 1)}
            >
              +1 Year
            </Button>
          </div>

          <FormField
            control={form.control}
            name="isReminderEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    // Add a console log here temporarily for debugging field.value
                    checked={(() => {
                      console.log(
                        `Rendering Checkbox - field.value for isReminderEnabled: ${field.value}`
                      );
                      return field.value;
                    })()}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Enable Reminder</FormLabel>
                  <FormDescription>
                    Send a reminder for follow-up
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Visit" : "Add Visit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
