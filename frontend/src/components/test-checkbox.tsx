"use client";

import * as React from "react";
import { Checkbox } from "./ui/checkbox";

export function TestCheckbox() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept Terms and Conditions
      </label>
    </div>
  );
}
