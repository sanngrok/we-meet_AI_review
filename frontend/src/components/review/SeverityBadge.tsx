import { Badge } from "@/components/ui/badge";

const SEVERITY_LABEL: Record<string, string> = {
  normal: "일반",
  uncomfortable: "불편",
  complaint: "불만",
  malicious: "악성",
};

export function SeverityBadge({
  severity,
  urgent,
}: {
  severity: string | null;
  urgent: boolean;
}) {
  if (urgent) return <Badge variant="destructive">긴급</Badge>;
  if (!severity) return null;
  const variant = severity === "complaint" || severity === "malicious" ? "destructive" : "secondary";
  return <Badge variant={variant}>{SEVERITY_LABEL[severity] ?? severity}</Badge>;
}
