"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type NaverPlaceResult = components["schemas"]["NaverPlaceResult"];

/** 네이버 지역 검색 자동완성 — query 는 호출부에서 디바운스해서 넘길 것. */
export function useNaverSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["naver-search", trimmed],
    queryFn: () => api<NaverPlaceResult[]>(`/naver/search?query=${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}
