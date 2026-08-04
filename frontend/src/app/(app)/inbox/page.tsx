"use client";

import { AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ReplyDrawer } from "@/components/review/ReplyDrawer";
import { ReviewCard } from "@/components/review/ReviewCard";
import { useStore } from "@/components/store-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews, type ReviewFilters, type ReviewItem } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

const FILTER_TABS: { value: string; label: string; filters: ReviewFilters }[] = [
  { value: "all", label: "전체", filters: {} },
  { value: "neg", label: "부정", filters: { sentiment: "neg" } },
  { value: "urgent", label: "긴급", filters: { urgent: true } },
  { value: "unanswered", label: "미답변", filters: { answered: false } },
];

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

export default function InboxPage() {
  const { store } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("filter") ?? "all";
  const filters = FILTER_TABS.find((t) => t.value === activeTab)?.filters ?? {};

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useReviews(
    store?.id,
    filters,
  );
  const [selected, setSelected] = useState<ReviewItem | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">리뷰 인박스</h1>
        <p className="text-sm text-muted-foreground">
          {store ? `${store.name}의 리뷰` : "리뷰 목록"}
        </p>
      </div>

      <div className="flex w-fit gap-1.5 rounded-lg border border-border bg-card p-0.5">
        {FILTER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => router.push(`/inbox?filter=${t.value}`)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === t.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingState />}

      {isError && !isLoading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            리뷰를 불러오지 못했습니다. 백엔드(<code>localhost:8000</code>)가 실행 중인지
            확인해 주세요.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            조건에 맞는 리뷰가 없습니다.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((review) => (
          <ReviewCard key={review.id} review={review} onClick={() => setSelected(review)} />
        ))}
      </div>

      <div ref={sentinelRef} />
      {isFetchingNextPage && <LoadingState />}

      <AnimatePresence>
        {selected && (
          <ReplyDrawer
            key={selected.id}
            review={selected}
            storeId={store?.id}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
