import React, { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(new Array(length).fill(""));

  useEffect(() => {
    // Synchronize external value with internal digits state
    if (value.length === length) {
      setDigits(value.split(""));
    } else if (value === "") {
      setDigits(new Array(length).fill(""));
    }
  }, [value, length]);

  const handleChange = (index: number, val: string) => {
    const newDigits = [...digits];
    // Only take the last character if multiple are entered (unless it's a paste)
    const char = val.slice(-1);

    if (char && !/^\d$/.test(char)) return; // Only allow digits

    newDigits[index] = char;
    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Move to next input if value is entered
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(pastedData)) return; // Only allow digits

    const newDigits = pastedData.split("");
    const updatedDigits = [...digits];
    newDigits.forEach((char, i) => {
      if (i < length) updatedDigits[i] = char;
    });

    setDigits(updatedDigits);
    onChange(updatedDigits.join(""));

    // Focus the last filled input or the last input
    const focusIndex = Math.min(newDigits.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 md:gap-3" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            "h-10 w-10 md:h-12 md:w-12 text-center text-lg font-bold p-0 focus:ring-2 focus:ring-primary focus:border-primary",
            digit ? "border-primary bg-primary/5" : "border-border",
          )}
        />
      ))}
    </div>
  );
}
