import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  // Validate the date is a valid Date object
  const isValidDate = date && date instanceof Date && isValid(date);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full pl-3 text-start font-normal",
            !isValidDate && "text-muted-foreground"
          )}
        >
          {isValidDate ? (
            format(date as Date, "dd-MM-yyyy")
          ) : (
            <span>Pick a date</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={isValidDate ? date : undefined}
          onSelect={setDate}
          initialFocus
          className=""
          classNames={{}}
        />
      </PopoverContent>
    </Popover>
  );
}
