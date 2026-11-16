"use client";

import { BellRing, MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { useStore } from "@/components/store-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { api } from "@/lib/api";
import {
  getExistingSubscription,
  isPushSupported,
  subscribeToPush,
  type PushSubscribeOutcome,
} from "@/lib/push";
import { cn } from "@/lib/utils";

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function SettingsContent() {
  const { store } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: settings, isLoading } = useSettings(store?.id);
  const updateSettings = useUpdateSettings(store?.id);

  const [pushStatus, setPushStatus] = useState<PushSubscribeOutcome | "idle" | "subscribing">(
    "idle",
  );
  const [kakaoStatus, setKakaoStatus] = useState<"idle" | "loading" | "connected" | "failed">(
    "idle",
  );
  // 서버 렌더(항상 미지원)와 클라이언트 렌더 결과가 달라 하이드레이션 에러가 나므로
  // 마운트 후에만 실제 지원 여부/기존 구독 상태를 반영한다.
  const [pushSupported, setPushSupported] = useState(false);
  useEffect(() => {
    setPushSupported(isPushSupported());
    getExistingSubscription()
      .then((sub) => sub && setPushStatus("subscribed"))
      .catch(() => {});
  }, []);

  // 카카오 인가 리다이렉트 콜백(?code=...) 처리. 인가 코드는 1회용이라 StrictMode 이중 실행에도
  // 한 번만 교환하도록 ref 로 막는다.
  const exchangedCode = useRef<string | null>(null);
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || exchangedCode.current === code) return;
    exchangedCode.current = code;
    setKakaoStatus("loading");
    api(`/auth/kakao/callback?code=${encodeURIComponent(code)}`)
      .then(() => setKakaoStatus("connected"))
      .catch(() => setKakaoStatus("failed"))
      .finally(() => router.replace("/settings"));
  }, [searchParams, router]);

  // 반드시 버튼 클릭(사용자 제스처) 안에서 호출 — lib/push.ts 참고
  const handlePushSubscribe = async () => {
    setPushStatus("subscribing");
    try {
      setPushStatus(await subscribeToPush());
    } catch {
      setPushStatus("denied");
    }
  };

  const kakaoAuthUrl =
    KAKAO_CLIENT_ID && KAKAO_REDIRECT_URI
      ? `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code&scope=talk_message`
      : null;

  return (
    <section className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">설정</h1>
        <p className="text-sm text-muted-foreground">
          {store ? `${store.name} · 알림 설정과 알림 채널 연동` : "알림 설정 · 알림 채널 연동"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!store ? (
            <p className="text-sm text-muted-foreground">먼저 매장을 등록해 주세요.</p>
          ) : isLoading || !settings ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <>
              <Toggle
                checked={settings.notify_urgent}
                onChange={(v) => updateSettings.mutate({ notify_urgent: v })}
                disabled={updateSettings.isPending}
                label="긴급 리뷰 알림"
                description="1~2점·악성 리뷰가 오면 바로 알려드려요"
              />
              <Toggle
                checked={settings.notify_digest}
                onChange={(v) => updateSettings.mutate({ notify_digest: v })}
                disabled={updateSettings.isPending}
                label="부정 리뷰 요약"
                description="일반 부정 리뷰를 모아서 알려드려요"
              />
              {updateSettings.isError && (
                <p className="text-xs text-destructive">저장에 실패했어요. 다시 시도해 주세요.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 채널 연동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InstallBanner />

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium">브라우저 웹푸시</span>
                <span className="block text-xs text-muted-foreground">
                  {pushSupported ? "이 기기에서 바로 알림을 받아요" : "이 브라우저는 웹푸시를 지원하지 않아요"}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePushSubscribe}
                disabled={
                  !pushSupported || pushStatus === "subscribing" || pushStatus === "subscribed"
                }
              >
                <BellRing className="h-4 w-4" />
                {pushStatus === "subscribed"
                  ? "켜짐"
                  : pushStatus === "subscribing"
                    ? "요청 중…"
                    : "알림 켜기"}
              </Button>
            </div>
            {pushStatus === "denied" && (
              <p className="mt-2 text-[11px] text-destructive">
                브라우저 알림 권한이 거부됐어요. 브라우저 설정에서 이 사이트 알림을 허용한 뒤 새로고침해 주세요.
              </p>
            )}
            {pushStatus === "no-vapid-key" && (
              <p className="mt-2 text-[11px] text-subtle-foreground">
                서버에 웹푸시 키가 아직 설정되지 않았어요.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium">카카오톡 (나에게 보내기)</span>
                <span className="block text-xs text-muted-foreground">
                  {kakaoAuthUrl ? "카카오톡으로 긴급 알림을 받아요" : "카카오 연동이 아직 설정되지 않았어요"}
                </span>
              </span>
              <Button
                variant={kakaoStatus === "connected" ? "outline" : "default"}
                size="sm"
                disabled={!kakaoAuthUrl || kakaoStatus === "loading" || kakaoStatus === "connected"}
                onClick={() => kakaoAuthUrl && window.location.assign(kakaoAuthUrl)}
              >
                <MessageCircle className="h-4 w-4" />
                {kakaoStatus === "connected"
                  ? "연동됨"
                  : kakaoStatus === "loading"
                    ? "연동 중…"
                    : "연동하기"}
              </Button>
            </div>
            {kakaoStatus === "failed" && (
              <p className="mt-2 text-[11px] text-destructive">
                카카오 연동에 실패했어요. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function SettingsPage() {
  // useSearchParams 는 Suspense 경계가 필요 (Next.js App Router)
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
