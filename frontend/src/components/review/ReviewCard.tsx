import { CheckCircle2, Star } from "lucide-react";
import { SeverityBadge } from "@/components/review/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReviewItem } from "@/hooks/useReviews";

type Aspect = { category: string; polarity: "pos" | "neg" };

export function ReviewCard({ review, onClick }: { review: ReviewItem; onClick: () => void }) {
  const aspects = review.aspects as Aspect[];

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer space-y-2.5 p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{review.author_masked ?? "익명"}</span>
          {review.rating != null && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-current" />
              {review.rating}
            </span>
          )}
          {review.written_at && (
            <span className="text-xs text-muted-foreground">{review.written_at}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {review.answered && (
            <Badge variant="accent">
              <CheckCircle2 className="h-3 w-3" />
              답변완료
            </Badge>
          )}
          <SeverityBadge severity={review.severity} urgent={review.urgent} />
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-foreground">{review.body}</p>

      {aspects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {aspects.map((a, i) => (
            <span
              key={i}
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs",
                a.polarity === "neg"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {a.category}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
