"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type Settings = components["schemas"]["SettingsOut"];
export type SettingsUpdate = components["schemas"]["SettingsUpdate"];

export function useSettings(storeId: number | undefined) {
  return useQuery({
    queryKey: ["settings", storeId],
    queryFn: () => api<Settings>(`/stores/${storeId}/settings`),
    enabled: storeId != null,
  });
}

export function useUpdateSettings(storeId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingsUpdate) =>
      api<Settings>(`/stores/${storeId}/settings`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", storeId], data);
    },
  });
}
