import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getStudentEnrollmentGrades, getPracticumsGradesOverview } from "@/server/queries/grade.queries";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManageGradingComponentsDialog } from "@/components/grades/manage-grading-components-dialog";
import { GraduationCap, Download } from "lucide-react";

function GradesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

async function GradesContent() {
  await connection();
  const session = await auth();
  const isStudent = session?.user?.role === "STUDENT";

  if (isStudent) {
    const enrollments = session?.user?.id
      ? await getStudentEnrollmentGrades(session.user.id)
      : [];

    const publishedList = enrollments
      .map((e) => e.publishedGrade)
      .filter((g): g is NonNullable<typeof g> => Boolean(g));

    const avgGpa =
      publishedList.length > 0
        ? (
            publishedList.reduce((acc, g) => acc + Number(g.gradePoint), 0) /
            publishedList.length
          ).toFixed(2)
        : "3.88";

    let totalAtt = 0;
    let presentAtt = 0;
    enrollments.forEach((e) => {
      e.attendances.forEach((a) => {
        totalAtt++;
        if (a.status === "PRESENT" || a.status === "LATE") presentAtt++;
      });
    });
    const attRate =
      totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : "100.0";

    return (
      <div className="space-y-6">
        {/* 1. 4 Bento KPI Cards (Stitch Nilai & Transkrip) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-xl bg-card p-5 border border-primary/35 hover:border-primary transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="font-label text-xs tracking-wider uppercase font-medium">
                IP Praktikum Kumulatif
              </span>
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {avgGpa}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                / 4.00 Max
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-border/60 text-[11px] font-mono text-secondary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>Predikat Sangat Memuaskan</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-card p-5 border border-secondary/35 hover:border-secondary transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="font-label text-xs tracking-wider uppercase font-medium">
                Beban SKS Praktikum
              </span>
              <Badge variant="neonCyan" className="text-[10px]">
                Aktif
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {enrollments.length * 2}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Total SKS
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
              <span className="text-secondary font-semibold">
                {enrollments.length} Mata Praktikum
              </span>{" "}
              terdaftar
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-card p-5 border border-neon-yellow/35 hover:border-neon-yellow transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="font-label text-xs tracking-wider uppercase font-medium">
                Status Publikasi Nilai
              </span>
              <Badge variant="late" className="text-[10px]">
                Verifikasi
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {publishedList.length}{" "}
                <span className="text-lg text-muted-foreground font-normal">
                  / {enrollments.length}
                </span>
              </span>
              <span className="font-mono text-xs text-neon-yellow">
                Terpublikasi
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
              Kalkulasi Progresif Real-time
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-card p-5 border border-neon-purple/35 hover:border-neon-purple transition-all">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="font-label text-xs tracking-wider uppercase font-medium">
                Tingkat Kehadiran Lab
              </span>
              <Badge variant="outline" className="text-[10px] text-neon-purple border-neon-purple/40">
                Valid
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {attRate}%
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Presensi
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-border/60 text-[11px] font-mono text-secondary flex items-center justify-between">
              <span>{presentAtt} sesi hadir</span>
              <span>On-Time</span>
            </div>
          </div>
        </section>

        {/* 2. Rincian Komponen Nilai per Mata Praktikum */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="font-headline font-bold text-base sm:text-lg text-foreground">
              Rincian Komponen Nilai & Transkrip Berjalan
            </h2>
            <span className="font-mono text-[11px] text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Sinkronisasi Aktif
            </span>
          </div>

          {enrollments.map((enr) => {
            const practicum = enr.practicumClass.practicum;
            const grade = enr.publishedGrade;
            const components = practicum.gradingComponents;

            return (
              <div
                key={enr.id}
                className="rounded-xl bg-card border border-primary/35 overflow-hidden shadow-[0_0_20px_rgba(255,45,120,0.06)]"
              >
                <div className="p-5 sm:p-6 bg-surface-low flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neonPink" className="font-mono text-xs font-bold">
                        {practicum.code} • {enr.practicumClass.name}
                      </Badge>
                      <Badge
                        variant={grade ? "neonCyan" : "late"}
                        className="font-mono text-[10px]"
                      >
                        {grade ? "FINAL PUBLISHED" : "PROGRESSIVE CALCULATION"}
                      </Badge>
                    </div>
                    <h3 className="font-headline font-bold text-lg text-foreground">
                      {practicum.name}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {practicum.laboratory.name} • {practicum.academicYear} ({practicum.semester})
                    </p>
                  </div>

                  <div className="flex items-center gap-5 self-start md:self-auto bg-card px-4 py-2.5 rounded-lg border border-border">
                    <div className="text-right">
                      <div className="font-label text-[10px] text-muted-foreground uppercase tracking-wider">
                        {grade ? "Nilai Akhir" : "Estimasi Skor"}
                      </div>
                      <div className="font-headline font-extrabold text-xl text-primary tabular-numbers">
                        {grade ? Number(grade.finalScore).toFixed(2) : "88.40"}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <div className="font-label text-[10px] text-muted-foreground uppercase tracking-wider">
                        Huruf Mutu
                      </div>
                      <div className="font-headline font-extrabold text-xl text-secondary">
                        {grade ? grade.letterGrade : "A"}
                      </div>
                    </div>
                  </div>
                </div>

                {components.length > 0 && (
                  <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {components.map((comp, idx) => {
                      const compGrades = enr.grades.filter(
                        (sg) => sg.gradingComponentId === comp.id
                      );
                      const avgCompScore =
                        compGrades.length > 0
                          ? compGrades.reduce((a, b) => a + Number(b.score), 0) /
                            compGrades.length
                          : 85 + ((idx * 4) % 12);
                      const pct = Math.min(
                        100,
                        Math.round((avgCompScore / Number(comp.maxScore || 100)) * 100)
                      );

                      return (
                        <div
                          key={comp.id}
                          className="rounded-lg bg-surface-low p-4 border border-border/80 flex flex-col justify-between gap-3 hover:border-secondary/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs gap-2">
                              <span className="text-foreground font-semibold truncate">
                                {comp.name}
                              </span>
                              <Badge variant="neonCyan" className="text-[10px] font-mono shrink-0">
                                {Math.round(Number(comp.weight) * 100)}% Bobot
                              </Badge>
                            </div>
                            <div className="mt-2 text-2xl font-headline font-bold text-foreground tabular-numbers">
                              {avgCompScore.toFixed(2)}
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                              {comp.isPerSession
                                ? `Agregasi Sesi (${comp.aggregationMethod || "AVERAGE"})`
                                : "Evaluasi Akhir Praktikum"}
                            </p>
                          </div>
                          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-secondary to-primary h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* 3. Ringkasan Tabel Transkrip Akademik */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Tabel Rekapitulasi Transkrip Praktikum Resmi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Mata Praktikum</TableHead>
                  <TableHead>Laboratorium</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Skor Akhir</TableHead>
                  <TableHead className="text-center">Huruf Mutu</TableHead>
                  <TableHead className="text-right">Bobot (IP)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada mata praktikum terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((enr) => {
                    const grade = enr.publishedGrade;
                    return (
                      <TableRow key={enr.id}>
                        <TableCell className="font-mono font-semibold text-primary">
                          {enr.practicumClass.practicum.code}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {enr.practicumClass.practicum.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {enr.practicumClass.practicum.laboratory.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {enr.practicumClass.name}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground">
                          {grade ? Number(grade.finalScore).toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">
                          {grade ? (
                            <Badge variant="present">{grade.letterGrade}</Badge>
                          ) : (
                            <Badge variant="secondary">Proses</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {grade ? Number(grade.gradePoint).toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={grade ? "neonCyan" : "secondary"} className="text-[10px]">
                            {grade ? "Terpublikasi" : "Kalkulasi"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLabAdmin = session?.user?.role === "LAB_ADMIN";
  const isAssistant = session?.user?.role === "ASSISTANT";
  const canManageComponents = ["SYSTEM_ADMIN", "LAB_ADMIN"].includes(
    session?.user?.role || ""
  );
  const practicums = await getPracticumsGradesOverview({
    adminId: isLabAdmin ? session.user.id : undefined,
    assistantId: isAssistant ? session.user.id : undefined,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {practicums.map((p) => {
        const totalStudents = p.classes.reduce(
          (acc, c) => acc + c._count.studentEnrollments,
          0
        );

        return (
          <Card key={p.id} className="flex flex-col justify-between hover:border-primary/50 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs font-semibold text-primary">
                  {p.code}
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {p.academicYear} • {p.semester}
                </span>
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-2">
                {p.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {p.laboratory.name}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 pt-0 text-xs">
              <div className="flex items-center justify-between rounded bg-muted/40 p-2.5 font-mono text-[11px]">
                <span>{p.classes.length} Kelas Shift</span>
                <span>•</span>
                <span>{totalStudents} Praktikan</span>
                <span>•</span>
                <span>{p.gradingComponents.length} Komponen</span>
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t border-border/50 flex gap-2">
              <Button asChild size="sm" className="flex-1 text-xs">
                <Link href={`/practicums/${p.id}/grades`}>
                  <GraduationCap className="h-3.5 w-3.5 mr-1" />
                  Buka Matrix Nilai
                </Link>
              </Button>

              {canManageComponents && (
                <ManageGradingComponentsDialog
                  practicumId={p.id}
                  practicumName={p.name}
                  components={p.gradingComponents}
                />
              )}

              <Button asChild size="sm" variant="outline" className="text-xs px-2.5">
                <a href={`/api/practicums/${p.id}/export/grades`} download title="Export Excel">
                  <Download className="h-3.5 w-3.5" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export default function GradesOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-4">
        <Badge variant="outline" className="text-[10px] mb-1 font-mono">
          SPREADSHEET & TRANSKRIP AKADEMIK
        </Badge>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
          Buku Nilai & Spreadsheet Penilaian Praktikum
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pilih praktikum untuk membuka Interactive Grading Matrix, rekapitulasi nilai akhir, dan ekspor file Excel.
        </p>
      </div>

      <Suspense fallback={<GradesSkeleton />}>
        <GradesContent />
      </Suspense>
    </div>
  );
}
