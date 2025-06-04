"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "./time-picker-input";

export function TimePicker({ date, setDate, showSeconds = true }) {
  const minuteRef = React.useRef(null);
  const hourRef = React.useRef(null);
  const secondRef = React.useRef(null);

  return (
    <div className="flex items-end gap-2">
      <TimePickerInput
        picker="hours"
        date={date}
        setDate={setDate}
        ref={hourRef}
        onRightFocus={() => minuteRef.current?.focus()}
      />
      <div className="flex h-10 items-center">:</div>
      <TimePickerInput
        picker="minutes"
        date={date}
        setDate={setDate}
        ref={minuteRef}
        onLeftFocus={() => hourRef.current?.focus()}
        onRightFocus={() =>
          showSeconds ? secondRef.current?.focus() : undefined
        }
      />
      {showSeconds && (
        <>
          <div className="flex h-10 items-center">:</div>
          <TimePickerInput
            picker="seconds"
            date={date}
            setDate={setDate}
            ref={secondRef}
            onLeftFocus={() => minuteRef.current?.focus()}
          />
        </>
      )}
    </div>
  );
}
