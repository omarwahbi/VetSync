"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  DateRangePicker as AriaDateRangePicker,
  Dialog,
  Group,
  Heading,
  Popover,
  RangeCalendar,
} from "react-aria-components";
import type { RangeValue } from "@react-types/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  parseDate,
  getLocalTimeZone,
  DateValue,
} from "@internationalized/date";
import { useTranslations } from "next-intl";

// Interface for DateRange similar to react-day-picker's DateRange
export interface DateRange {
  from: Date;
  to?: Date;
}

// Props for our custom DateRangePicker component
interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  onApply?: () => void;
}

export function DateRangePicker({
  dateRange,
  onChange,
  placeholder = "Select date range",
  className,
  onApply,
}: DateRangePickerProps) {
  const t = useTranslations("Visits");
  const [isOpen, setIsOpen] = useState(false);

  // Convert DateRange to react-aria's format
  const value = dateRange
    ? {
        start: dateRange.from
          ? parseDate(dateRange.from.toISOString().split("T")[0])
          : undefined,
        end: dateRange.to
          ? parseDate(dateRange.to.toISOString().split("T")[0])
          : undefined,
      }
    : null;

  // Handle change from react-aria component
  const handleChange = (value: RangeValue<DateValue> | null) => {
    if (!value || !value.start) {
      onChange(undefined);
      return;
    }

    const newDateRange: DateRange = {
      from: value.start.toDate(getLocalTimeZone()),
      to: value.end?.toDate(getLocalTimeZone()),
    };

    onChange(newDateRange);
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const handleApply = () => {
    setIsOpen(false);
    if (onApply) {
      onApply();
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    // Use DD-MM-YYYY format for consistency
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <AriaDateRangePicker
      value={value as RangeValue<DateValue>}
      onChange={handleChange}
      shouldCloseOnSelect={false}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-start font-normal bg-white dark:bg-muted",
          !dateRange && "text-muted-foreground",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <Calendar className="me-2 h-4 w-4" />
        {dateRange?.from ? (
          dateRange.to ? (
            <>
              {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
            </>
          ) : (
            formatDate(dateRange.from)
          )
        ) : (
          <span>{placeholder}</span>
        )}
      </Button>
      <Popover className="w-auto p-0">
        <Dialog className="p-4 bg-popover rounded-md shadow-md border">
          <Group>
            <RangeCalendar className="mb-4">
              <header className="flex items-center justify-between mb-2">
                <Heading className="font-medium text-sm" />
                <div className="flex gap-1">
                  <AriaButton
                    slot="previous"
                    className="p-1 rounded-sm hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.5 12.5L5.5 8.5L9.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </AriaButton>
                  <AriaButton
                    slot="next"
                    className="p-1 rounded-sm hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.5 12.5L10.5 8.5L6.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </AriaButton>
                </div>
              </header>
              <CalendarGrid className="border-collapse">
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={({
                      isSelected,
                      isSelectionStart,
                      isSelectionEnd,
                      isFocusVisible,
                    }) =>
                      cn(
                        "h-9 w-9 rounded-md flex items-center justify-center text-sm outline-none group relative",
                        !isSelected && "hover:bg-muted/50",
                        isSelected && "bg-primary text-primary-foreground",
                        (isSelectionStart || isSelectionEnd) && "rounded-md",
                        !isSelectionStart &&
                          !isSelectionEnd &&
                          isSelected &&
                          "bg-primary/20 text-foreground",
                        isFocusVisible && "ring-2 ring-offset-2 ring-primary"
                      )
                    }
                  />
                )}
              </CalendarGrid>
            </RangeCalendar>
          </Group>
          <div className="flex items-center justify-between pt-2 border-t mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs h-7"
            >
              {t("clear")}
            </Button>
            <Button size="sm" onClick={handleApply} className="text-xs h-7">
              {t("apply")}
            </Button>
          </div>
        </Dialog>
      </Popover>
    </AriaDateRangePicker>
  );
}
