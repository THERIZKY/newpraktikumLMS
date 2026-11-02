import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSubmissionsList,
  getStudentActiveAssignments,
} from "@/server/queries/submission.queries";
import { SubmissionsClient } from "@/components/submissions/submissions-client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function SubmissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function SubmissionsContent({
  searchParams,
}: {
  searchParams: Promise<{ practicumId?: string; status?: string }>;
}) {
  await connection();
  const { practicumId, status } = await searchParams;
  const session = await auth();

  const isStudent = session?.user?.role === "STUDENT";
  const isAssistant = session?.user?.role === "ASSISTANT";
  const isLabAdmin = session?.user?.role === "LAB_ADMIN";
  const canReview = ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(
    session?.user?.role || ""
  );

  const [formattedSubmissions, studentAssignments] = await Promise.all([
    getSubmissionsList({
      practicumId,
      status,
      studentId: isStudent ? session?.user?.id : undefined,
      assistantId: isAssistant ? session?.user?.id : undefined,
      labAdminId: isLabAdmin ? session?.user?.id : undefined,
    }),
    isStudent && session?.user?.id
      ? getStudentActiveAssignments(session.user.id)
      : Promise.resolve(undefined),
  ]);

  return (
    <SubmissionsClient
      submissions={formattedSubmissions}
      canReview={canReview}
      studentAssignments={studentAssignments}
    />
  );
}

export default function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ practicumId?: string; status?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">
              MULTI-VERSION WORKSPACE
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Tugas & Riwayat Pengumpulan (v1, v2, v3...)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen pengumpulan laporan praktikum, riwayat revisi ber-versi, dan evaluasi asisten.
          </p>
        </div>
      </div>

      <Suspense fallback={<SubmissionsSkeleton />}>
        <SubmissionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
