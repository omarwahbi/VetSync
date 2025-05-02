import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  dateRange,
  setDateRange,
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  // Add validation to ensure dates are valid
  const isValidRange = React.useMemo(() => {
    if (!dateRange) return false;

    // Check if from date exists and is valid
    const validFrom = dateRange.from instanceof Date && isValid(dateRange.from);

    // Check if to date exists and is valid (when present)
    const validTo =
      !dateRange.to || (dateRange.to instanceof Date && isValid(dateRange.to));

    return validFrom && validTo;
  }, [dateRange]);

  // Handle clearing the date range
  const handleClearDateRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDateRange(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal relative pr-8",
            !isValidRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {isValidRange && dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd-MM-yyyy")} -{" "}
                {format(dateRange.to, "dd-MM-yyyy")}
              </>
            ) : (
              format(dateRange.from, "dd-MM-yyyy")
            )
          ) : (
            <span>{placeholder}</span>
          )}

          {isValidRange && dateRange?.from && (
            <span
              className="absolute right-0 top-0 h-full px-3 py-0 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={handleClearDateRange}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear date range</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={(range) => {
            console.log("Calendar date range selected:", range);
            setDateRange(range);
          }}
          numberOfMonths={2}
        />
        <div className="p-3 border-t border-border flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange(undefined)}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => {
              // Force close the popover by simulating Escape key
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Escape" })
              );
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
