"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  Heading,
  Calendar as AriaCalendar,
} from "react-aria-components";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type DateValue, CalendarDate } from "@internationalized/date";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

interface SingleDatePickerProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  isDisabled?: boolean;
}

export function SingleDatePicker({
  date,
  onChange,
  className,
  placeholder,
  maxDate,
  minDate,
  isDisabled = false,
}: SingleDatePickerProps) {
  const t = useTranslations("Common");
  const params = useParams();
  const locale = params.locale as string;
  const isRtl = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Convert Date to react-aria's format with correct timezone handling
  const value = date
    ? new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1, // JavaScript months are 0-based, CalendarDate expects 1-based
        date.getDate()
      )
    : null;

  // Handle click outside to close the date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle change from react-aria component
  const handleChange = (value: DateValue | null) => {
    if (!value) {
      onChange(undefined);
      return;
    }

    // Create a new JS Date preserving the exact date that was selected
    const newDate = new Date(
      value.year,
      value.month - 1, // Convert back to 0-based month for JavaScript Date
      value.day
    );

    onChange(newDate);
    // Close the popup when selecting a date
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    onChange(undefined);
    setIsOpen(false);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    setIsOpen(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!isDisabled) {
      setIsOpen(!isOpen);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    // Use locale-aware date formatting
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      ref={datePickerRef}
      className={cn(
        "relative single-date-picker",
        isRtl ? "rtl" : "ltr",
        className
      )}
    >
      <Button
        type="button" // Explicitly set type to button to prevent form submission
        variant="outline"
        className={cn(
          "w-full justify-start text-start font-normal bg-white dark:bg-muted",
          !date && "text-muted-foreground"
        )}
        onClick={handleButtonClick}
        disabled={isDisabled}
      >
        <Calendar className="me-2 h-4 w-4" />
        {date ? (
          formatDate(date)
        ) : (
          <span>{placeholder || t("selectDate")}</span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full start-0 mt-1 z-50 bg-popover rounded-md shadow-md border p-4 w-auto">
          <AriaCalendar
            value={value}
            onChange={handleChange}
            className="mb-4"
            minValue={
              minDate
                ? new CalendarDate(
                    minDate.getFullYear(),
                    minDate.getMonth() + 1,
                    minDate.getDate()
                  )
                : undefined
            }
            maxValue={
              maxDate
                ? new CalendarDate(
                    maxDate.getFullYear(),
                    maxDate.getMonth() + 1,
                    maxDate.getDate()
                  )
                : undefined
            }
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
              {(cellDate) => (
                <CalendarCell
                  date={cellDate}
                  className={({ isSelected, isFocusVisible, isDisabled }) =>
                    cn(
                      "h-9 w-9 rounded-md flex items-center justify-center text-sm outline-none group relative",
                      !isSelected && !isDisabled && "hover:bg-muted/50",
                      (isSelected ||
                        (value &&
                          cellDate.day === value.day &&
                          cellDate.month === value.month &&
                          cellDate.year === value.year)) &&
                        "bg-primary text-primary-foreground",
                      isDisabled && "text-muted-foreground opacity-50",
                      isFocusVisible && "ring-2 ring-offset-2 ring-primary"
                    )
                  }
                />
              )}
            </CalendarGrid>
          </AriaCalendar>
          <div className="flex items-center justify-between pt-2 border-t mt-2">
            <Button
              type="button" // Explicitly set type to button to prevent form submission
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs h-7"
            >
              {t("clear")}
            </Button>
            <Button
              type="button" // Explicitly set type to button to prevent form submission
              size="sm"
              onClick={handleApply}
              className="text-xs h-7"
            >
              {t("apply")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
