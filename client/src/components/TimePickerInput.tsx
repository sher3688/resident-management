"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function TimePickerInput({
  value,
  onChange,
  label,
  placeholder = "YYYY-MM-DD HH:mm",
}: TimePickerInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // 將 ISO 格式 (YYYY-MM-DDTHH:mm) 轉換為顯示格式 (YYYY-MM-DD HH:mm)
  const isoToDisplay = (isoStr: string) => {
    if (!isoStr) return "";
    return isoStr.replace("T", " ");
  };

  // 將顯示格式 (YYYY-MM-DD HH:mm) 轉換為 ISO 格式 (YYYY-MM-DDTHH:mm)
  const displayToIso = (displayStr: string) => {
    if (!displayStr) return "";
    return displayStr.replace(" ", "T");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);

    // 驗證格式 YYYY-MM-DD HH:mm
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    if (regex.test(newValue)) {
      // 轉換為 ISO 格式後傳送給父元件
      onChange(displayToIso(newValue));
    }
  };

  const incrementHour = () => {
    if (!displayValue) return;
    const [date, time] = displayValue.split(" ");
    if (!time) return;

    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours, 10);
    hour = (hour + 1) % 24;

    const newTime = `${String(hour).padStart(2, "0")}:${minutes}`;
    const newValue = `${date} ${newTime}`;
    setDisplayValue(newValue);
    onChange(displayToIso(newValue));
  };

  const decrementHour = () => {
    if (!displayValue) return;
    const [date, time] = displayValue.split(" ");
    if (!time) return;

    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours, 10);
    hour = (hour - 1 + 24) % 24;

    const newTime = `${String(hour).padStart(2, "0")}:${minutes}`;
    const newValue = `${date} ${newTime}`;
    setDisplayValue(newValue);
    onChange(displayToIso(newValue));
  };

  const incrementMinute = () => {
    if (!displayValue) return;
    const [date, time] = displayValue.split(" ");
    if (!time) return;

    const [hours, minutes] = time.split(":");
    let minute = parseInt(minutes, 10);
    let hour = parseInt(hours, 10);

    minute = (minute + 5) % 60;
    if (minute === 0 && parseInt(minutes, 10) !== 55) {
      hour = (hour + 1) % 24;
    }

    const newTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const newValue = `${date} ${newTime}`;
    setDisplayValue(newValue);
    onChange(displayToIso(newValue));
  };

  const decrementMinute = () => {
    if (!displayValue) return;
    const [date, time] = displayValue.split(" ");
    if (!time) return;

    const [hours, minutes] = time.split(":");
    let minute = parseInt(minutes, 10);
    let hour = parseInt(hours, 10);

    minute = (minute - 5 + 60) % 60;
    if (minute === 55 && parseInt(minutes, 10) === 0) {
      hour = (hour - 1 + 24) % 24;
    }

    const newTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const newValue = `${date} ${newTime}`;
    setDisplayValue(newValue);
    onChange(displayToIso(newValue));
  };

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          value={isoToDisplay(displayValue)}
          onChange={handleChange}
          placeholder={placeholder}
          className="font-mono"
        />
        <div className="flex gap-1">
          <div className="flex flex-col gap-0.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={incrementHour}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={decrementHour}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-0.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={incrementMinute}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={decrementMinute}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">格式：YYYY-MM-DD HH:mm (24小時制)</p>
    </div>
  );
}
