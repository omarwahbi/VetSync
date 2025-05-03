"use client";

import { useEffect, useState } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { addMonths, addYears } from "date-fns";
import { useAuthStore } from "@/store/auth";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

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
import { Input } from "@/components/ui/input";
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
    price: z.number().positive().max(999999.99).optional().nullable(),
    // Vital signs fields
    temperature: z.number().min(0).max(50).optional().nullable(),
    weight: z.number().min(0).optional().nullable(),
    weightUnit: z.enum(["kg", "lb"]).optional(),
    heartRate: z.number().int().min(0).optional().nullable(),
    respiratoryRate: z.number().int().min(0).optional().nullable(),
    bloodPressure: z.string().optional().nullable(),
    spo2: z.number().min(0).max(100).optional().nullable(),
    crt: z.string().optional().nullable(),
    mmColor: z.string().optional().nullable(),
    painScore: z.number().min(0).max(10).optional().nullable(),
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
  quickAdd?: boolean;
  onSubmit: (data: VisitFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
  // New prop to optionally pass the selected pet data
  selectedPetData?: {
    owner?: {
      allowAutomatedReminders?: boolean;
    };
  };
  hideButtons?: boolean;
}

export function VisitForm({
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
  selectedPetData,
  hideButtons = false,
  quickAdd = false,
}: VisitFormProps) {
  const t = useTranslations("VisitForm");
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  // Add state for showing all vital signs
  const [showAllVitals, setShowAllVitals] = useState(false);

  // Log what we receive as initialData
  console.log("VisitForm received initialData:", initialData);
  console.log("VisitForm received selectedPetData:", selectedPetData);

  // Get clinic reminder settings from auth store
  const clinicCanSendReminders = useAuthStore(
    (state) => state.user?.clinic?.canSendReminders ?? false
  );

  // Determine if owner allows reminders
  const ownerAllowsReminders =
    // If editing (initialData exists), check from initialData
    initialData?.pet?.owner?.allowAutomatedReminders ??
    // If creating (selectedPetData exists), check from selectedPetData
    selectedPetData?.owner?.allowAutomatedReminders ??
    // Default to true if data structure is missing
    true;

  // Combined permission check - both clinic and owner need to allow reminders
  const remindersAllowed = clinicCanSendReminders && ownerAllowsReminders;

  // Debug log for reminders settings
  console.log("Clinic can send reminders:", clinicCanSendReminders);
  console.log("Owner allows reminders:", ownerAllowsReminders);
  console.log("Reminders allowed:", remindersAllowed);

  // --- Refined Default Value Logic ---
  // Extract only the form fields from initialData
  const formFields: Partial<VisitFormValues> = initialData
    ? {
        visitDate: initialData.visitDate,
        visitType: initialData.visitType,
        notes: initialData.notes,
        isReminderEnabled: initialData.isReminderEnabled,
        nextReminderDate: initialData.nextReminderDate,
        price: initialData.price !== undefined ? initialData.price : null,
        temperature: initialData.temperature ?? null,
        weight: initialData.weight ?? null,
        weightUnit: initialData.weightUnit || "kg",
        heartRate: initialData.heartRate ?? null,
        respiratoryRate: initialData.respiratoryRate ?? null,
        bloodPressure: initialData.bloodPressure ?? null,
        spo2: initialData.spo2 ?? null,
        crt: initialData.crt ?? null,
        mmColor: initialData.mmColor ?? null,
        painScore: initialData.painScore ?? null,
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
        // Also consider owner's preference and clinic settings - if either opted out, force to false
        isReminderEnabled: remindersAllowed
          ? formFields.isReminderEnabled ?? true
          : false,
        // Handle price - parse if it's a string from API
        price:
          formFields.price !== undefined && formFields.price !== null
            ? typeof formFields.price === "string"
              ? parseFloat(formFields.price)
              : formFields.price
            : null,
        // Handle vital signs fields
        temperature: formFields.temperature ?? null,
        weight: formFields.weight ?? null,
        weightUnit: formFields.weightUnit || "kg",
        heartRate: formFields.heartRate ?? null,
        respiratoryRate: formFields.respiratoryRate ?? null,
        bloodPressure: formFields.bloodPressure ?? null,
        spo2: formFields.spo2 ?? null,
        crt: formFields.crt ?? null,
        mmColor: formFields.mmColor ?? null,
        painScore: formFields.painScore ?? null,
      }
    : {
        // Defaults for a NEW form
        visitDate: new Date(),
        visitType: "",
        notes: "",
        isReminderEnabled: remindersAllowed, // Set based on both clinic and owner preferences
        nextReminderDate: undefined,
        price: null,
        // Default vital signs
        temperature: null,
        weight: null,
        weightUnit: "kg",
        heartRate: null,
        respiratoryRate: null,
        bloodPressure: null,
        spo2: null,
        crt: null,
        mmColor: null,
        painScore: null,
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

  // Force isReminderEnabled to false if reminders are not allowed
  useEffect(() => {
    if (!remindersAllowed) {
      form.setValue("isReminderEnabled", false, { shouldValidate: true });
    }
  }, [remindersAllowed, form]);

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

    // Ensure weightUnit is set if weight is provided
    const weightUnit = visitData.weight
      ? visitData.weightUnit || "kg"
      : undefined;

    const submissionData = {
      ...visitData,
      visitDate,
      nextReminderDate,
      weightUnit,
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

  // Format currency for display
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse numeric input removing commas
  const parseNumericInput = (value: string): number | null => {
    if (value === "") return null;
    // Remove all commas before parsing
    return parseFloat(value.replace(/,/g, ""));
  };

  return (
    <Form {...form}>
      <form
        id="visit-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <FormField
          control={form.control}
          name="visitDate"
          render={({
            field,
          }: {
            field: ControllerRenderProps<VisitFormValues, "visitDate">;
          }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={isRTL ? "text-right" : "text-left"}>
                {t("visitDate")}
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  className={isRTL ? "text-right" : "text-left"}
                />
              </FormControl>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
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
              <FormLabel className={isRTL ? "text-right" : "text-left"}>
                {t("visitType")}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={isRTL ? "text-right" : "text-left"}>
                    <SelectValue placeholder={t("selectVisitType")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={isRTL ? "text-right" : "text-left"}>
                  {visitTypeOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={isRTL ? "text-right" : "text-left"}
                    >
                      {t(`visitTypes.${option.value}`)}
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
          name="price"
          render={({
            field,
          }: {
            field: ControllerRenderProps<VisitFormValues, "price">;
          }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={isRTL ? "text-right" : "text-left"}>
                {t("visitPrice")}
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="0.00"
                  className={isRTL ? "text-right" : "text-left"}
                  value={formatCurrency(field.value)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    // Only allow digits, commas, and decimal point
                    const value = e.target.value.replace(/[^\d,.]/g, "");
                    // Only update if it's a valid number or empty
                    if (value === "" || /^[\d,]+(\.\d*)?$/.test(value)) {
                      field.onChange(parseNumericInput(value));
                    }
                  }}
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
            field: ControllerRenderProps<VisitFormValues, "notes">;
          }) => (
            <FormItem className="w-full">
              <FormLabel className={isRTL ? "text-right" : "text-left"}>
                {t("notes")}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("optionalNotesPlaceholder")}
                  className={isRTL ? "text-right" : "text-left"}
                  {...field}
                />
              </FormControl>
              <FormMessage className={isRTL ? "text-right" : "text-left"} />
            </FormItem>
          )}
        />

        <div className="space-y-4 border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <h4 className={isRTL ? "text-right" : "text-left"}>
              {t("vitalSigns")}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAllVitals(!showAllVitals)}
            >
              {showAllVitals ? t("showLess") : t("showMore")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weight with Weight Unit - Always visible */}
            <div className="flex gap-2 rtl:space-x-reverse">
              <FormField
                control={form.control}
                name="weight"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<VisitFormValues, "weight">;
                }) => (
                  <FormItem className="flex-1">
                    <FormLabel className={isRTL ? "text-right" : "text-left"}>
                      {t("weight")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="5.5"
                        className={isRTL ? "text-right" : "text-left"}
                        {...field}
                        value={field.value !== null ? field.value : ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseFloat(e.target.value)
                            : null;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage
                      className={isRTL ? "text-right" : "text-left"}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightUnit"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<VisitFormValues, "weightUnit">;
                }) => (
                  <FormItem className="w-24">
                    <FormLabel className={isRTL ? "text-right" : "text-left"}>
                      {t("unit")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={isRTL ? "text-right" : "text-left"}
                        >
                          <SelectValue placeholder="kg" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        className={isRTL ? "text-right" : "text-left"}
                      >
                        <SelectItem
                          value="kg"
                          className={isRTL ? "text-right" : "text-left"}
                        >
                          kg
                        </SelectItem>
                        <SelectItem
                          value="lb"
                          className={isRTL ? "text-right" : "text-left"}
                        >
                          lb
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage
                      className={isRTL ? "text-right" : "text-left"}
                    />
                  </FormItem>
                )}
              />
            </div>

            {/* Heart Rate - Always visible */}
            <FormField
              control={form.control}
              name="heartRate"
              render={({
                field,
              }: {
                field: ControllerRenderProps<VisitFormValues, "heartRate">;
              }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={isRTL ? "text-right" : "text-left"}>
                    {t("heartRate")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="120"
                      className={isRTL ? "text-right" : "text-left"}
                      {...field}
                      value={field.value !== null ? field.value : ""}
                      onChange={(e) => {
                        const value = e.target.value
                          ? parseInt(e.target.value)
                          : null;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage className={isRTL ? "text-right" : "text-left"} />
                </FormItem>
              )}
            />

            {/* Only show these fields when showAllVitals is true */}
            {showAllVitals && (
              <>
                <div className="col-span-1 md:col-span-2 border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                  <span className="text-sm text-muted-foreground text-start block">
                    {t("additionalVitalSigns")}
                  </span>
                </div>

                {/* Temperature */}
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      VisitFormValues,
                      "temperature"
                    >;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={isRTL ? "text-right" : "text-left"}>
                        {t("temperature")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="38.5"
                          className={isRTL ? "text-right" : "text-left"}
                          {...field}
                          value={field.value !== null ? field.value : ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage
                        className={isRTL ? "text-right" : "text-left"}
                      />
                    </FormItem>
                  )}
                />

                {/* Respiratory Rate */}
                <FormField
                  control={form.control}
                  name="respiratoryRate"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      VisitFormValues,
                      "respiratoryRate"
                    >;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={isRTL ? "text-right" : "text-left"}>
                        {t("respiratoryRate")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="24"
                          className={isRTL ? "text-right" : "text-left"}
                          {...field}
                          value={field.value !== null ? field.value : ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage
                        className={isRTL ? "text-right" : "text-left"}
                      />
                    </FormItem>
                  )}
                />

                {/* SpO2 */}
                <FormField
                  control={form.control}
                  name="spo2"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<VisitFormValues, "spo2">;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={isRTL ? "text-right" : "text-left"}>
                        {t("spo2")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="98"
                          className={isRTL ? "text-right" : "text-left"}
                          {...field}
                          value={field.value !== null ? field.value : ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage
                        className={isRTL ? "text-right" : "text-left"}
                      />
                    </FormItem>
                  )}
                />

                {/* CRT */}
                <FormField
                  control={form.control}
                  name="crt"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<VisitFormValues, "crt">;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={isRTL ? "text-right" : "text-left"}>
                        {t("crt")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="< 2"
                          className={isRTL ? "text-right" : "text-left"}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage
                        className={isRTL ? "text-right" : "text-left"}
                      />
                    </FormItem>
                  )}
                />

                {/* Blood Pressure */}
                <FormField
                  control={form.control}
                  name="bloodPressure"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      VisitFormValues,
                      "bloodPressure"
                    >;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={isRTL ? "text-right" : "text-left"}>
                        {t("bloodPressure")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="120/80"
                          className={isRTL ? "text-right" : "text-left"}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage
                        className={isRTL ? "text-right" : "text-left"}
                      />
                    </FormItem>
                  )}
                />

                {/* MM Color */}
                <FormField
                  control={form.control}
                  name="mmColor"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<VisitFormValues, "mmColor">;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={isRTL ? "text-right" : "text-left"}>
                        {t("mmColor")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Pink"
                          className={isRTL ? "text-right" : "text-left"}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage
                        className={isRTL ? "text-right" : "text-left"}
                      />
                    </FormItem>
                  )}
                />

                {/* Pain Score */}
                <FormField
                  control={form.control}
                  name="painScore"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<VisitFormValues, "painScore">;
                  }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={isRTL ? "text-right" : "text-left"}>
                        {t("painScore")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          placeholder="0"
                          className={isRTL ? "text-right" : "text-left"}
                          {...field}
                          value={field.value !== null ? field.value : ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage
                        className={isRTL ? "text-right" : "text-left"}
                      />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <FormLabel className={isRTL ? "text-right" : "text-left block"}>
              {t("reminderSettings")}
            </FormLabel>
            <FormDescription
              className={isRTL ? "text-right" : "text-left block"}
            >
              {clinicCanSendReminders
                ? t("configureReminder")
                : t("remindersNotEnabled")}
            </FormDescription>
          </div>

          {/* Show next reminder date field regardless of reminder status */}
          <FormField
            control={form.control}
            name="nextReminderDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<VisitFormValues, "nextReminderDate">;
            }) => (
              <FormItem className="flex flex-col">
                <FormLabel className={isRTL ? "text-right" : "text-left"}>
                  {t("nextVisitDate")}{" "}
                  {clinicCanSendReminders &&
                    form.watch("isReminderEnabled") && (
                      <span className="text-red-500">*</span>
                    )}
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value instanceof Date ? field.value : undefined}
                    setDate={(date) => field.onChange(date)}
                  />
                </FormControl>
                <FormDescription className={isRTL ? "text-right" : "text-left"}>
                  {!clinicCanSendReminders
                    ? t("remindersNotEnabled")
                    : !ownerAllowsReminders
                    ? t("ownerOptedOut")
                    : form.watch("isReminderEnabled")
                    ? t("sendAutomatedReminder")
                    : t("noReminderButDateRecorded")}
                </FormDescription>
                <FormMessage className={isRTL ? "text-right" : "text-left"} />
              </FormItem>
            )}
          />

          {/* Quick reminder date buttons - should always be available */}
          <div className="flex flex-wrap gap-2 mt-1 rtl:space-x-reverse">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(1)}
            >
              {t("oneMonth")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(3)}
            >
              {t("threeMonths")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(6)}
            >
              {t("sixMonths")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReminderDate(0, 1)}
            >
              {t("oneYear")}
            </Button>
          </div>

          {/* Only show the checkbox if clinic can send reminders */}
          {clinicCanSendReminders && (
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!remindersAllowed}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel
                      className={`text-start block ${
                        !remindersAllowed ? "text-muted-foreground" : ""
                      }`}
                    >
                      {t("enableReminder")}
                    </FormLabel>
                    <FormDescription className="text-start block">
                      {remindersAllowed
                        ? t("sendReminder")
                        : ownerAllowsReminders
                        ? t("remindersDisabledForClinic")
                        : t("ownerOptedOut")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        {!hideButtons && (
          <div className="flex justify-end mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
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
                  {t("saving")}
                </>
              ) : initialData ? (
                t("updateVisit")
              ) : (
                t("addVisit")
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
