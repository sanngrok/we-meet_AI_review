"use client";

import { DiagnosisCard } from "@/components/report/DiagnosisCard";
import { PrescriptionChecklist } from "@/components/report/PrescriptionChecklist";
import { useStore } from "@/components/store-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestReport, type Diagnosis, type Prescription } from "@/hooks/useReport";
import { ApiError } from "@/lib/api";

const LEVEL_ORDER = ["crit", "warn", "strength", "opportunity"] as const;

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export default function ReportsPage() {
  const { store } = useStore();
  const { data: report, isLoading, isError, error } = useLatestReport(store?.id);

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">주간 리포트</h1>
        <p className="text-sm text-muted-foreground">
          {report ? `${report.week_start} 시작 주 진단` : "매장 평판 진단"}
        </p>
      </div>

      {isLoading && <LoadingState />}

      {isError && !isLoading && notFound && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            아직 생성된 리포트가 없습니다. 리뷰 수집·분석이 누적되면 매주 자동 생성돼요.
          </CardContent>
        </Card>
      )}

      {isError && !isLoading && !notFound && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            리포트를 불러오지 못했습니다. 백엔드(<code>localhost:8000</code>)가 실행 중인지
            확인해 주세요.
          </CardContent>
        </Card>
      )}

      {report && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {(report.diagnosis as Diagnosis[])
              .slice()
              .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
              .map((d, i) => (
                <DiagnosisCard key={i} level={d.level} title={d.title} evidence={d.evidence} />
              ))}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">처방 체크리스트</h2>
            <PrescriptionChecklist items={report.prescriptions as Prescription[]} />
          </div>
        </div>
      )}
    </section>
  );
}
