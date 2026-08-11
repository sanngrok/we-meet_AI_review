"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { Prescription } from "@/hooks/useReport";
import { cn } from "@/lib/utils";

export function PrescriptionChecklist({ items }: { items: Prescription[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
            className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/40"
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                checked[i] ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {checked[i] && <Check className="h-3 w-3" />}
            </span>
            <span>
              <span
                className={cn(
                  "block text-sm font-medium",
                  checked[i] && "text-muted-foreground line-through",
                )}
              >
                {item.title}
              </span>
              <span className="block text-xs text-muted-foreground">{item.detail}</span>
              <span className="mt-1 block text-xs text-primary">
                기대 효과: {item.expected_effect}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
