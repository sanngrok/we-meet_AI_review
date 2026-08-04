"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/store-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { api } from "@/lib/api";
import { isPushSupported, subscribeWebPush } from "@/lib/push";
import { cn } from "@/lib/utils";

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { store } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: settings, isLoading } = useSettings(store?.id);
  const updateSettings = useUpdateSettings(store?.id);

  const [pushStatus, setPushStatus] = useState<"idle" | "loading" | "on" | "failed">("idle");
  const [kakaoStatus, setKakaoStatus] = useState<"idle" | "loading" | "connected" | "failed">(
    "idle",
  );
  // 서버(항상 false)와 클라이언트(브라우저 지원 여부) 렌더 결과가 달라 하이드레이션 에러가
  // 나므로, 마운트 후에만 실제 값으로 갱신한다.
  const [pushSupported, setPushSupported] = useState(false);
  useEffect(() => setPushSupported(isPushSupported()), []);

  // 카카오 인증 리다이렉트 콜백(?code=...) 처리
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    setKakaoStatus("loading");
    api(`/auth/kakao/callback?code=${encodeURIComponent(code)}`)
      .then(() => setKakaoStatus("connected"))
      .catch(() => setKakaoStatus("failed"))
      .finally(() => router.replace("/settings"));
  }, [searchParams, router]);

  const handleWebPush = async () => {
    setPushStatus("loading");
    const ok = await subscribeWebPush();
    setPushStatus(ok ? "on" : "failed");
  };

  const kakaoAuthUrl =
    KAKAO_CLIENT_ID && KAKAO_REDIRECT_URI
      ? `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code&scope=talk_message`
      : null;

  return (
    <section className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-xl font-bold">설정</h1>
        <p className="text-sm text-muted-foreground">알림 설정 · 알림 채널 연동</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !settings ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="divide-y divide-border">
              <Toggle
                checked={settings.notify_urgent}
                onChange={(v) => updateSettings.mutate({ notify_urgent: v })}
                label="긴급 리뷰 즉시 알림"
                description="별점 낮음 · 악성/불만 리뷰가 올라오면 바로 알림"
              />
              <Toggle
                checked={settings.notify_digest}
                onChange={(v) => updateSettings.mutate({ notify_digest: v })}
                label="일반 부정 리뷰 요약 알림"
                description="긴급이 아닌 부정 리뷰를 모아서 알림"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 채널 연동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">웹푸시</p>
              <p className="text-xs text-muted-foreground">
                {pushSupported ? "이 브라우저에서 알림 수신" : "이 브라우저는 웹푸시 미지원"}
              </p>
            </div>
            <Button
              size="sm"
              variant={pushStatus === "on" ? "outline" : "default"}
              disabled={!pushSupported || pushStatus === "loading"}
              onClick={handleWebPush}
            >
              {pushStatus === "on" ? "연동됨" : pushStatus === "failed" ? "다시 시도" : "켜기"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">카카오톡 (나에게 보내기)</p>
              <p className="text-xs text-muted-foreground">
                {kakaoAuthUrl ? "카카오톡으로 알림 수신" : "카카오 연동이 아직 설정되지 않았어요"}
              </p>
            </div>
            {kakaoAuthUrl ? (
              <a href={kakaoAuthUrl} className={cn(buttonVariants({ size: "sm" }))}>
                {kakaoStatus === "connected" ? "연동됨" : "연동하기"}
              </a>
            ) : (
              <Button size="sm" variant="outline" disabled>
                연동하기
              </Button>
            )}
          </div>

          {kakaoStatus === "failed" && (
            <p className="text-xs text-destructive">카카오 연동에 실패했습니다.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
