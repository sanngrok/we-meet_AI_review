import { AlertTriangle, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DiagnosisLevel } from "@/hooks/useReport";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG: Record<
  DiagnosisLevel,
  { label: string; icon: typeof AlertTriangle; classes: string }
> = {
  crit: {
    label: "긴급",
    icon: ShieldAlert,
    classes: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  warn: {
    label: "주의",
    icon: AlertTriangle,
    classes: "border-warn/30 bg-warn/10 text-warn",
  },
  strength: {
    label: "강점",
    icon: TrendingUp,
    classes: "border-delta-up/30 bg-delta-up/10 text-delta-up",
  },
  opportunity: {
    label: "기회",
    icon: Sparkles,
    classes: "border-primary/30 bg-primary/10 text-primary",
  },
};

export function DiagnosisCard({
  level,
  title,
  evidence,
}: {
  level: DiagnosisLevel;
  title: string;
  evidence: string;
}) {
  const cfg = LEVEL_CONFIG[level];
  const Icon = cfg.icon;
  return (
    <Card className={cn("space-y-2 p-4", cfg.classes)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <Icon className="h-3.5 w-3.5" />
        {cfg.label}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{evidence}</p>
    </Card>
  );
}
