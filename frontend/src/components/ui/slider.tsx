"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min = 0, max = 100, step = 1, value = [0], onValueChange, disabled, ...props }, ref) => {
    const currentValue = value[0] ?? 0;
    const percentage = ((currentValue - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Math.max(min, Math.min(max, Number(e.target.value)));
      const steppedValue = Math.round(newValue / step) * step;
      onValueChange?.([steppedValue]);
    };

    return (
      <div className={cn("relative w-full", className)}>
        <div className="relative h-1.5 bg-muted rounded-full">
          <div
            className="absolute h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${percentage}%` }}
          />
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleChange}
            disabled={disabled}
            className="absolute h-full w-full cursor-pointer appearance-none bg-transparent"
            style={{ pointerEvents: disabled ? "none" : "auto" }}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };