import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getPracticumGradingMatrix } from "@/server/services/grading.service";
import { InteractiveMatrix } from "@/components/grades/interactive-matrix";
import { ManageGradingComponentsDialog } from "@/components/grades/manage-grading-components-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

function PracticumGradesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

async function PracticumGradesContent({
  params,
}: {
  params: Promise<{ practicumId: string }>;
}) {
  await connection();
  const { practicumId } = await params;
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  const matrix = await getPracticumGradingMatrix(practicumId);
  const { practicum, components, students } = matrix;

  if (userRole === "LAB_ADMIN" && practicum.laboratory.adminId !== userId) {
    redirect("/grades");
  }
  const assistantClassNames = new Set(
    practicum.classes
      .filter((c) => c.assistantAssignments.some((a) => a.assistantId === userId))
      .map((c) => c.name)
  );
  if (userRole === "ASSISTANT" && assistantClassNames.size === 0) {
    redirect("/grades");
  }
  if (userRole === "STUDENT" && !students.some((s) => s.studentId === userId)) {
    redirect("/grades");
  }

  const canPublish = ["SYSTEM_ADMIN", "LAB_ADMIN"].includes(userRole || "");
  const canEditScores = ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(
    userRole || ""
  );

  const displayStudents =
    userRole === "STUDENT"
      ? students.filter((s) => s.studentId === userId)
      : userRole === "ASSISTANT"
      ? students.filter((s) => assistantClassNames.has(s.className))
      : students;

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
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
              {practicum.code}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Semester {practicum.semester} {practicum.academicYear}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {practicum.laboratory.name}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Interactive Grading Matrix & Buku Nilai: {practicum.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluasi nilai terbobot mahasiswa secara langsung, kalkulasi nilai akhir otomatis, publikasi nilai, dan ekspor spreadsheet.
          </p>
        </div>

        {canPublish && (
          <div className="flex items-center gap-2">
            <ManageGradingComponentsDialog
              practicumId={practicum.id}
              practicumName={practicum.name}
              components={components}
            />
          </div>
        )}
      </div>

      <InteractiveMatrix
        practicumId={practicum.id}
        components={components.map((c) => ({
          id: c.id,
          name: c.name,
          weight: Number(c.weight),
          isPerSession: c.isPerSession,
        }))}
        initialStudents={displayStudents}
        canPublish={canPublish}
        canEditScores={canEditScores}
      />
    </div>
  );
}

export default function PracticumGradesPage({
  params,
}: {
  params: Promise<{ practicumId: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-3">
        <Badge variant="outline" className="text-[10px] font-mono">
          INTERACTIVE GRADING MATRIX
        </Badge>
      </div>

      <Suspense fallback={<PracticumGradesSkeleton />}>
        <PracticumGradesContent params={params} />
      </Suspense>
    </div>
  );
}
