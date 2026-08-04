"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StoreSearchInput } from "@/components/onboarding/StoreSearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NaverPlaceResult } from "@/hooks/useNaverSearch";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type StoreOut = components["schemas"]["StoreOut"];
type ChannelOut = components["schemas"]["ChannelOut"];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [naverUrl, setNaverUrl] = useState("");
  const [storeId, setStoreId] = useState<number | null>(null);

  const createStore = useMutation({
    mutationFn: () =>
      api<StoreOut>("/stores", {
        method: "POST",
        body: JSON.stringify({ name, category: category || null, address: address || null }),
      }),
    onSuccess: (store) => {
      setStoreId(store.id);
      setStep(2);
    },
  });

  const createChannel = useMutation({
    mutationFn: () =>
      api<ChannelOut>(`/stores/${storeId}/channels`, {
        method: "POST",
        body: JSON.stringify({ platform: "naver", external_url: naverUrl }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      router.push("/dashboard");
    },
  });

  const handleSelect = (place: NaverPlaceResult) => {
    setName(place.name);
    if (place.category) setCategory(place.category);
    if (place.road_address ?? place.address) setAddress(place.road_address ?? place.address ?? "");
    if (place.link) setNaverUrl(place.link);
  };

  return (
    <section className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-xl font-bold">매장 등록</h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 ? "1/2 · 매장 정보" : "2/2 · 네이버 플레이스 URL"}
        </p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>매장 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">매장명</label>
              <StoreSearchInput value={name} onChange={setName} onSelect={handleSelect} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">카테고리</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="카페 / 식당 / 미용실 ..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">주소</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {createStore.isError && (
              <p className="text-xs text-destructive">매장 등록에 실패했습니다.</p>
            )}

            <Button
              className="w-full"
              disabled={!name.trim() || createStore.isPending}
              onClick={() => createStore.mutate()}
            >
              다음
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>네이버 플레이스 URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              리뷰 수집 대상이 되는 네이버 플레이스 페이지 주소를 입력하세요. 검색 결과에서
              자동으로 채워졌다면 확인 후 필요시 수정하세요.
            </p>
            <input
              value={naverUrl}
              onChange={(e) => setNaverUrl(e.target.value)}
              placeholder="https://map.naver.com/p/entry/place/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            {createChannel.isError && (
              <p className="text-xs text-destructive">채널 등록에 실패했습니다.</p>
            )}

            <Button
              className="w-full"
              disabled={!naverUrl.trim() || createChannel.isPending}
              onClick={() => createChannel.mutate()}
            >
              완료
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
