"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type Report = components["schemas"]["ReportRead"];
export type DiagnosisLevel = "crit" | "warn" | "strength" | "opportunity";
export type Diagnosis = { level: DiagnosisLevel; title: string; evidence: string };
export type Prescription = { title: string; detail: string; expected_effect: string };

export function useLatestReport(storeId: number | undefined) {
  return useQuery({
    queryKey: ["report", storeId],
    queryFn: () => api<Report>(`/stores/${storeId}/reports/latest`),
    enabled: storeId != null,
    retry: false,
  });
}
