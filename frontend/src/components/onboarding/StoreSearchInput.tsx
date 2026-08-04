"use client";

import { useEffect, useState } from "react";
import { useNaverSearch, type NaverPlaceResult } from "@/hooks/useNaverSearch";

/** 네이버 지역 검색 자동완성 입력창. 결과가 없어도 자유 입력은 항상 가능하다. */
export function StoreSearchInput({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (name: string) => void;
  onSelect: (place: NaverPlaceResult) => void;
}) {
  const [debounced, setDebounced] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  const { data: results = [], isFetching } = useNaverSearch(debounced);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="매장명을 입력해 검색"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && value.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {isFetching && (
            <div className="px-3 py-2 text-xs text-muted-foreground">검색 중...</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              검색 결과가 없습니다. 직접 입력해 주세요.
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(r);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">{r.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {r.road_address ?? r.address ?? ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
