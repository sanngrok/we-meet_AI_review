"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApproveReply, useGenerateReply, type Tone } from "@/hooks/useReplies";
import type { ReviewItem } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

const SMARTPLACE_URL = "https://new.smartplace.naver.com/";

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "polite", label: "정중" },
  { value: "friendly", label: "친근" },
  { value: "apologetic", label: "사과" },
];

export function ReplyDrawer({
  review,
  storeId,
  onClose,
}: {
  review: ReviewItem;
  storeId: number | undefined;
  onClose: () => void;
}) {
  const [tone, setTone] = useState<Tone | null>(null);
  const [draft, setDraft] = useState(review.reply_draft ?? "");
  const [replyId, setReplyId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const generateReply = useGenerateReply(storeId);
  const approveReply = useApproveReply(storeId);

  const canApprove = review.answered || replyId != null;

  const handleTone = (value: Tone) => {
    setTone(value);
    generateReply.mutate(
      { reviewId: review.id, tone: value },
      {
        onSuccess: (reply) => {
          setDraft(reply.draft);
          setReplyId(reply.id);
        },
      },
    );
  };

  const handleApprove = async () => {
    if (replyId != null) {
      await approveReply.mutateAsync(replyId);
    }
    await navigator.clipboard.writeText(draft);
    window.open(SMARTPLACE_URL, "_blank", "noopener,noreferrer");
    setCopied(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-lg"
      >
        <p className="mb-1 text-xs text-muted-foreground">{review.author_masked ?? "익명"}</p>
        <p className="mb-4 line-clamp-3 text-sm">{review.body}</p>

        <div className="mb-3 flex gap-2">
          {TONE_OPTIONS.map((t) => (
            <Button
              key={t.value}
              size="sm"
              variant={tone === t.value ? "default" : "outline"}
              onClick={() => handleTone(t.value)}
              disabled={generateReply.isPending}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {generateReply.isPending ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="톤을 선택하면 AI 답글 초안이 여기에 표시됩니다."
            rows={5}
            className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}

        {generateReply.isError && (
          <p className="mt-2 text-xs text-destructive">
            답글 생성에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button
            className="flex-1"
            disabled={!canApprove || !draft || approveReply.isPending}
            onClick={handleApprove}
          >
            승인하고 답글 달러가기
          </Button>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>

        <p className={cn("mt-2 text-xs text-accent-foreground", !copied && "invisible")}>
          복사됨 — 붙여넣기만 하세요
        </p>
      </motion.div>
    </div>
  );
}
