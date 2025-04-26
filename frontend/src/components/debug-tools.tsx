"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * A specialized select component that uses debounce to prevent infinite update loops
 */
interface DebouncedSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
}

export function DebouncedSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder = "Select an option",
  disabled = false,
  className = "w-full",
  debounceMs = 50,
}: DebouncedSelectProps) {
  // Use internal state to track the value and a ref to avoid triggering effects
  const [internalValue, setInternalValue] = useState<string>(value || "");
  const internalValueRef = useRef(internalValue);
  const lastUpdated = useRef<number>(Date.now());
  const updateScheduled = useRef<boolean>(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const instanceId = useRef<string>(
    `select-${Math.random().toString(36).slice(2, 9)}`
  );
  const renderCount = useRef<number>(0);
  const prevValueRef = useRef(value);

  // Keep track of the latest value prop
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;

      // Only update internal state if the value is different
      if (value !== internalValue) {
        setInternalValue(value);
        internalValueRef.current = value;
      }
    }
  }, [value, internalValue]);

  // Handle value change with debounce
  const handleChange = useCallback(
    (newValue: string) => {
      // Update internal state immediately
      setInternalValue(newValue);
      internalValueRef.current = newValue;

      // Clear any existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      // Create a new timeout
      updateTimeoutRef.current = setTimeout(() => {
        // Only call parent handler if our internal value is still the same
        // This prevents race conditions with fast changes
        if (internalValueRef.current === newValue) {
          onValueChange(newValue);
        }
        updateScheduled.current = false;
        lastUpdated.current = Date.now();
        updateTimeoutRef.current = null;
      }, debounceMs);
    },
    [onValueChange, debounceMs]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Log render for debugging
  renderCount.current++;

  return (
    <div data-instance-id={instanceId.current}>
      {label && <p className="text-sm font-medium mb-2">{label}</p>}
      <Select
        value={internalValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="w-full">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * A utility to track and log state updates
 */
export function useTrackedState<T>(initialValue: T, name: string) {
  const [state, setState] = useState<T>(initialValue);
  const updateCount = useRef(0);

  const trackedSetState = useCallback(
    (newValue: T) => {
      updateCount.current++;
      console.log(`[useTrackedState ${name}] Update #${updateCount.current}:`, {
        current: state,
        new: newValue,
        stack: new Error().stack?.split("\n").slice(1, 3).join("\n"),
      });
      setState(newValue);
    },
    [name, state]
  );

  return [state, trackedSetState] as const;
}

/**
 * A memoized function to help debug render cycles
 */
export function useComponentLogger(
  componentName: string,
  props: Record<string, unknown>
) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    console.log(`[${componentName}] Rendered #${renderCount.current}`, {
      props,
    });

    return () => {
      console.log(`[${componentName}] Unmounted`);
    };
  }, [componentName, props]);

  return renderCount.current;
}
