"use client";

import { useEffect, useState } from "react";
import { useNaverSearch, type NaverPlaceResult } from "@/hooks/useNaverSearch";

/**
 * 네이버 지역 검색 자동완성 입력창 (온보딩 1단계 매장 이름).
 * 결과가 없거나 백엔드에 NAVER 키가 없어도(빈 리스트) 자유 입력은 항상 가능하다.
 */
export function StoreSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "매장명을 입력해 검색",
  className,
}: {
  value: string;
  onChange: (name: string) => void;
  onSelect: (place: NaverPlaceResult) => void;
  placeholder?: string;
  className?: string;
}) {
  const [debounced, setDebounced] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  const { data: results = [], isFetching, isError } = useNaverSearch(debounced);
  // 결과가 있을 때만 드롭다운을 띄운다 — 키 미설정/오류/무결과면 일반 입력창처럼 동작
  const showDropdown = open && value.trim().length >= 2 && (isFetching || results.length > 0);

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
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showDropdown && !isError && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {isFetching && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">검색 중…</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.name}-${i}`}
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
