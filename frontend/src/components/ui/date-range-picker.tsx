"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  Heading,
  RangeCalendar,
} from "react-aria-components";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type DateValue, CalendarDate } from "@internationalized/date";
import type { RangeValue } from "@react-types/shared";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

// Interface for DateRange similar to react-day-picker's DateRange
export interface DateRange {
  from: Date;
  to?: Date;
}

// Props for our custom DateRangePicker component
interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
  className?: string;
  onApply?: () => void;
}

export function DateRangePicker({
  dateRange,
  onChange,
  className,
  onApply,
}: DateRangePickerProps) {
  const t = useTranslations("Visits");
  const params = useParams();
  const locale = params.locale as string;
  const isRtl = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Convert DateRange to react-aria's format
  const value = dateRange
    ? {
        start: dateRange.from
          ? new CalendarDate(
              dateRange.from.getFullYear(),
              dateRange.from.getMonth() + 1,
              dateRange.from.getDate()
            )
          : undefined,
        end: dateRange.to
          ? new CalendarDate(
              dateRange.to.getFullYear(),
              dateRange.to.getMonth() + 1,
              dateRange.to.getDate()
            )
          : undefined,
      }
    : null;

  // Handle change from react-aria component
  const handleChange = (value: RangeValue<DateValue> | null) => {
    if (!value || !value.start) {
      onChange(undefined);
      return;
    }

    // Create JavaScript Date objects directly from the calendar date components
    // to avoid timezone issues
    const fromDate = new Date(
      value.start.year,
      value.start.month - 1,
      value.start.day
    );

    // Only create the toDate if value.end exists
    const toDate = value.end
      ? new Date(value.end.year, value.end.month - 1, value.end.day)
      : undefined;

    const newDateRange: DateRange = {
      from: fromDate,
      to: toDate,
    };

    onChange(newDateRange);

    // Close the calendar when a complete range is selected
    if (value.start && value.end) {
      setIsOpen(false);
      if (onApply) {
        onApply();
      }
    }
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
    // Use locale-aware date formatting
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      className={cn(
        "relative date-range-picker",
        isRtl ? "rtl" : "ltr",
        className
      )}
    >
      <Button
        ref={buttonRef}
        variant="outline"
        className={cn(
          "w-full justify-start text-start font-normal bg-white dark:bg-muted",
          !dateRange && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
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
          <span>{t("filterByDate")}</span>
        )}
      </Button>

      {isOpen && (
        <div
          ref={popupRef}
          className="absolute top-full start-0 mt-1 z-50 bg-popover rounded-md shadow-md border p-4 w-auto"
        >
          <RangeCalendar
            value={value as RangeValue<DateValue>}
            onChange={handleChange}
            className="mb-4"
          >
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
                      d={
                        isRtl
                          ? "M9.5 12.5L5.5 8.5L9.5 4.5"
                          : "M9.5 12.5L5.5 8.5L9.5 4.5"
                      }
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
                      d={
                        isRtl
                          ? "M6.5 12.5L10.5 8.5L6.5 4.5"
                          : "M6.5 12.5L10.5 8.5L6.5 4.5"
                      }
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
          <div className="flex items-center justify-between pt-2 border-t mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs h-7"
              type="button"
            >
              {t("clear")}
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="text-xs h-7"
              type="button"
            >
              {t("apply")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
