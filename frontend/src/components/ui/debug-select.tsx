"use client";

import React, { useEffect, useRef, useState } from "react";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DebugSelectProps {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

let renderCounter = 0;

export function DebugSelect({
  name,
  value,
  onValueChange,
  children,
  disabled = false,
  className = "",
  placeholder = "Select...",
}: DebugSelectProps) {
  const componentId = useRef(
    `debug-select-${name}-${Math.random().toString(36).substring(2, 9)}`
  );
  const renderCount = useRef(0);
  const [internalValue, setInternalValue] = useState<string>(value || "");

  // Track previous props for comparison
  const prevPropsRef = useRef({ value });

  renderCount.current++;
  renderCounter++;

  console.log(
    `[${new Date().toISOString()}] DebugSelect ${name} (${
      componentId.current
    }): Render #${renderCount.current} (Global: ${renderCounter})`
  );
  console.log(`[${new Date().toISOString()}] DebugSelect ${name} Props:`, {
    value,
    prevValue: prevPropsRef.current.value,
    internalValue,
    disabled,
    className,
  });

  // Update internal state when prop value changes
  useEffect(() => {
    // Check if value actually changed from previous value
    if (prevPropsRef.current.value !== value) {
      console.log(
        `[${new Date().toISOString()}] DebugSelect ${name}: Value prop changed from "${
          prevPropsRef.current.value
        }" to "${value}"`
      );
      setInternalValue(value);
    }
    prevPropsRef.current = { value };
  }, [name, value]);

  // Update internal state when it changes
  useEffect(() => {
    console.log(
      `[${new Date().toISOString()}] DebugSelect ${name}: Internal value is now "${internalValue}"`
    );
  }, [name, internalValue]);

  // Handle value change
  const handleValueChange = (newValue: string) => {
    console.log(
      `[${new Date().toISOString()}] DebugSelect ${name}: Value changing from "${internalValue}" to "${newValue}"`
    );

    // Block rapid repeated identical changes
    if (newValue === internalValue) {
      console.log(
        `[${new Date().toISOString()}] DebugSelect ${name}: BLOCKED - Value unchanged`
      );
      return;
    }

    // Guard against undefined or null
    if (newValue === undefined || newValue === null) {
      console.log(
        `[${new Date().toISOString()}] DebugSelect ${name}: BLOCKED - Value is undefined/null`
      );
      return;
    }

    // Update internal value
    setInternalValue(newValue);

    // Call parent handler
    console.log(
      `[${new Date().toISOString()}] DebugSelect ${name}: Calling parent onValueChange with "${newValue}"`
    );
    onValueChange(newValue);

    // Check for call stack depth
    const stackSize = new Error().stack?.split("\n").length || 0;
    console.log(
      `[${new Date().toISOString()}] DebugSelect ${name}: Current call stack depth: ${stackSize}`
    );
  };

  return (
    <div
      className="debug-select-wrapper"
      data-component-id={componentId.current}
    >
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {children}
      </Select>
      <div className="debug-info hidden">
        <p>Component ID: {componentId.current}</p>
        <p>Render count: {renderCount.current}</p>
        <p>Value: {value}</p>
        <p>Internal value: {internalValue}</p>
      </div>
    </div>
  );
}
