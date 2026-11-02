import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getPracticumById } from "@/server/queries/practicum.queries";
import { getSubmissionsList } from "@/server/queries/submission.queries";
import { SubmissionsClient } from "@/components/submissions/submissions-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

function PracticumSubmissionsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

async function PracticumSubmissionsContent({
  params,
}: {
  params: Promise<{ practicumId: string }>;
}) {
  await connection();
  const { practicumId } = await params;
  const practicum = await getPracticumById(practicumId);

  if (!practicum) {
    notFound();
  }

  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (userRole === "LAB_ADMIN" && practicum.laboratory.adminId !== userId) {
    redirect("/practicums");
  }
  if (
    userRole === "ASSISTANT" &&
    !practicum.classes.some((c) =>
      c.assistantAssignments.some((a) => a.assistant.id === userId)
    )
  ) {
    redirect("/practicums");
  }
  if (
    userRole === "STUDENT" &&
    !practicum.classes.some((c) =>
      c.studentEnrollments.some((e) => e.studentId === userId)
    )
  ) {
    redirect("/practicums");
  }

  const isStudent = userRole === "STUDENT";
  const isAssistant = userRole === "ASSISTANT";
  const isLabAdmin = userRole === "LAB_ADMIN";
  const canReview = ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(
    userRole || ""
  );

  const formattedSubmissions = await getSubmissionsList({
    practicumId,
    studentId: isStudent ? userId : undefined,
    assistantId: isAssistant ? userId : undefined,
    labAdminId: isLabAdmin ? userId : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href={`/practicums/${practicumId}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke {practicum.name}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
              {practicum.code}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {formattedSubmissions.length} Berkas Pengumpulan
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Antrean Review Tugas: {practicum.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluasi riwayat unggahan tugas mahasiswa, beri catatan koreksi, dan ubah status versi.
          </p>
        </div>
      </div>

      <SubmissionsClient
        submissions={formattedSubmissions}
        canReview={canReview}
      />
    </div>
  );
}

export default function PracticumSubmissionsPage({
  params,
}: {
  params: Promise<{ practicumId: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-3">
        <Badge variant="outline" className="text-[10px] font-mono">
          ANTREAN PENGUMPULAN & REVIEW TUGAS
        </Badge>
      </div>

      <Suspense fallback={<PracticumSubmissionsSkeleton />}>
        <PracticumSubmissionsContent params={params} />
      </Suspense>
    </div>
  );
}
