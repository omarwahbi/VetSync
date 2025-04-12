"use client";

import { useEffect } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { addMonths, addYears } from "date-fns";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";

// Define validation schema
const visitSchema = z
  .object({
    visitDate: z.date({
      required_error: "Visit date is required",
    }),
    visitType: z.string().min(1, "Visit type is required"),
    notes: z.string().optional(),
    // Schema default is for new records, edited records use their own value
    isReminderEnabled: z.boolean(),
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

// Extension of VisitFormValues that includes related data not in the form schema
export interface VisitFormData extends VisitFormValues {
  id?: string;
  petId?: string;
  pet?: {
    id?: string;
    name?: string;
    owner?: {
      id?: string;
      allowAutomatedReminders?: boolean;
    };
  };
}

interface VisitFormProps {
  initialData?: VisitFormData;
  onSubmit: (data: VisitFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
  // New prop to optionally pass the selected pet data
  selectedPetData?: {
    owner?: {
      allowAutomatedReminders?: boolean;
    };
  };
}

export function VisitForm({
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
  selectedPetData,
}: VisitFormProps) {
  // Log what we receive as initialData
  console.log("VisitForm received initialData:", initialData);
  console.log("VisitForm received selectedPetData:", selectedPetData);

  // Determine if owner allows reminders
  const ownerAllowsReminders =
    // If editing (initialData exists), check from initialData
    initialData?.pet?.owner?.allowAutomatedReminders ??
    // If creating (selectedPetData exists), check from selectedPetData
    selectedPetData?.owner?.allowAutomatedReminders ??
    // Default to true if data structure is missing
    true;

  // Debug log for owner reminders preference
  console.log("Owner allows reminders:", ownerAllowsReminders);
  console.log(
    "Source:",
    initialData?.pet?.owner?.allowAutomatedReminders !== undefined
      ? "initialData"
      : selectedPetData?.owner?.allowAutomatedReminders !== undefined
      ? "selectedPetData"
      : "default value"
  );

  // --- Refined Default Value Logic ---
  // Extract only the form fields from initialData
  const formFields: Partial<VisitFormValues> = initialData
    ? {
        visitDate: initialData.visitDate,
        visitType: initialData.visitType,
        notes: initialData.notes,
        isReminderEnabled: initialData.isReminderEnabled,
        nextReminderDate: initialData.nextReminderDate,
      }
    : {};

  const defaultValuesForForm: VisitFormValues = initialData
    ? {
        // Spread only the form fields we extracted
        ...(formFields as VisitFormValues),
        // Explicitly process dates as they need conversion
        visitDate:
          formFields.visitDate instanceof Date
            ? formFields.visitDate
            : new Date(),
        nextReminderDate:
          formFields.nextReminderDate instanceof Date
            ? formFields.nextReminderDate
            : undefined,
        // Explicitly set boolean, falling back to true if undefined in initialData
        // Also consider owner's preference - if they opted out, force to false
        isReminderEnabled: ownerAllowsReminders
          ? formFields.isReminderEnabled ?? true
          : false,
      }
    : {
        // Defaults for a NEW form
        visitDate: new Date(),
        visitType: "",
        notes: "",
        isReminderEnabled: ownerAllowsReminders, // Set based on owner preference
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

  // Force isReminderEnabled to false if owner opted out of reminders
  useEffect(() => {
    if (!ownerAllowsReminders) {
      form.setValue("isReminderEnabled", false, { shouldValidate: true });
    }
  }, [ownerAllowsReminders, form]);

  const handleSubmit = (data: unknown) => {
    const visitData = data as VisitFormValues;

    // Ensure visitDate is a valid Date and nextReminderDate is properly handled
    const visitDate =
      visitData.visitDate instanceof Date ? visitData.visitDate : new Date();

    // Always include nextReminderDate if it's a valid date, regardless of reminder enabled status
    const nextReminderDate =
      visitData.nextReminderDate instanceof Date
        ? visitData.nextReminderDate
        : undefined;

    const submissionData = {
      ...visitData,
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
          render={({
            field,
          }: {
            field: ControllerRenderProps<VisitFormValues, "visitDate">;
          }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="">Visit Date</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value instanceof Date ? field.value : new Date()}
                  setDate={(date) => field.onChange(date || new Date())}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visitType"
          render={({
            field,
          }: {
            field: ControllerRenderProps<VisitFormValues, "visitType">;
          }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="">Visit Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select visit type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="">
                  {visitTypeOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className=""
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({
            field,
          }: {
            field: ControllerRenderProps<VisitFormValues, "notes">;
          }) => (
            <FormItem className="">
              <FormLabel className="">Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional notes about the visit"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="" />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <FormLabel className="">Reminder Settings</FormLabel>
            <FormDescription className="">
              Configure the next reminder for this pet
            </FormDescription>
          </div>

          {/* Always show the next reminder date field, but validate based on isReminderEnabled */}
          <FormField
            control={form.control}
            name="nextReminderDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<VisitFormValues, "nextReminderDate">;
            }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="">
                  Next Visit Date{" "}
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
                <FormDescription className="">
                  {!ownerAllowsReminders
                    ? "Visit date will be recorded but no automated reminder will be sent"
                    : form.watch("isReminderEnabled")
                    ? "Send automated reminder on this date"
                    : "No automated reminder will be sent, but date is still recorded"}
                </FormDescription>
                <FormMessage className="" />
              </FormItem>
            )}
          />

          {/* Quick reminder date buttons - should always be available */}
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
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                VisitFormValues,
                "isReminderEnabled"
              >;
            }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!ownerAllowsReminders}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel
                    className={
                      !ownerAllowsReminders ? "text-muted-foreground" : ""
                    }
                  >
                    Enable Reminder
                  </FormLabel>
                  <FormDescription className="">
                    {ownerAllowsReminders
                      ? "Send a reminder for follow-up"
                      : "Owner has opted out of automated reminders"}
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
