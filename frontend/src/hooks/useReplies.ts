"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type Reply = components["schemas"]["ReplyRead"];
export type Tone = components["schemas"]["ReplyGenerateIn"]["tone"];

export function useGenerateReply(storeId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, tone }: { reviewId: number; tone: Tone }) =>
      api<Reply>(`/reviews/${reviewId}/reply:generate`, {
        method: "POST",
        body: JSON.stringify({ tone }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", storeId] });
    },
  });
}

export function useApproveReply(storeId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId: number) =>
      api<Reply>(`/replies/${replyId}:approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", storeId] });
    },
  });
}
