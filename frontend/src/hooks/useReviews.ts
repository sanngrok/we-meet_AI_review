"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type ReviewItem = components["schemas"]["ReviewItem"];
export type Sentiment = "pos" | "neu" | "neg";

export type ReviewFilters = {
  sentiment?: Sentiment;
  urgent?: boolean;
  answered?: boolean;
};

const PAGE_SIZE = 20;

function buildQuery(filters: ReviewFilters, cursor?: number) {
  const params = new URLSearchParams();
  if (filters.sentiment) params.set("sentiment", filters.sentiment);
  if (filters.urgent != null) params.set("urgent", String(filters.urgent));
  if (filters.answered != null) params.set("answered", String(filters.answered));
  if (cursor != null) params.set("cursor", String(cursor));
  params.set("limit", String(PAGE_SIZE));
  return params.toString();
}

export function useReviews(storeId: number | undefined, filters: ReviewFilters) {
  return useInfiniteQuery({
    queryKey: ["reviews", storeId, filters],
    queryFn: ({ pageParam }) =>
      api<components["schemas"]["ReviewsPage"]>(
        `/stores/${storeId}/reviews?${buildQuery(filters, pageParam)}`,
      ),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: storeId != null,
  });
}
