import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getPracticumById } from "@/server/queries/practicum.queries";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateClassDialog } from "@/components/practicums/create-class-dialog";
import { GradingComponentDialog } from "@/components/practicums/grading-component-dialog";
import {
  Building2,
  Users,
  Award,
  FileCheck2,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

function PracticumDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-10 w-96 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

async function PracticumDetailContent({
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

  const visibleClasses =
    userRole === "ASSISTANT"
      ? practicum.classes.filter((c) =>
          c.assistantAssignments.some((a) => a.assistant.id === userId)
        )
      : userRole === "STUDENT"
      ? practicum.classes.filter((c) =>
          c.studentEnrollments.some((e) => e.studentId === userId)
        )
      : practicum.classes;

  const canManage = ["SYSTEM_ADMIN", "LAB_ADMIN"].includes(userRole || "");

  const totalWeight = practicum.gradingComponents.reduce(
    (acc, gc) => acc + Number(gc.weight) * 100,
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                {practicum.code}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {practicum.academicYear} • Semester {practicum.semester}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {practicum.laboratory.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {practicum.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {practicum.description || "Kurikulum terpadu praktikum dengan modul, presensi, penugasan ber-versi, dan evaluasi berbasis rubrik."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href={`/practicums/${practicum.id}/submissions`}>
                <FileCheck2 className="h-3.5 w-3.5 mr-1 text-neon-cyan" />
                Antrean Tugas
              </Link>
            </Button>
            <Button asChild size="sm" className="text-xs">
              <Link href={`/practicums/${practicum.id}/grades`}>
                <GraduationCap className="h-3.5 w-3.5 mr-1 text-neon-yellow" />
                Buku Nilai & Matrix
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="classes" className="text-xs flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Kelas & Shift ({visibleClasses.length})
          </TabsTrigger>
          <TabsTrigger value="rubric" className="text-xs flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Skema Penilaian ({practicum.gradingComponents.length})
          </TabsTrigger>
          <TabsTrigger value="letters" className="text-xs flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Konversi Nilai Huruf ({practicum.gradeLetters.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5" />
            Daftar Tugas ({practicum.assignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daftar Shift Kelas Praktikum</h3>
              <p className="text-xs text-muted-foreground">Pilih kelas untuk mengelola sesi pertemuan, modul, dan presensi praktikan.</p>
            </div>
            {canManage && <CreateClassDialog practicumId={practicum.id} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleClasses.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                <Users className="mx-auto h-7 w-7 mb-2 opacity-40 text-primary" />
                <p className="text-xs font-medium">Belum ada kelas dibuka untuk praktikum ini.</p>
              </div>
            ) : (
              visibleClasses.map((cls) => (
                <Card key={cls.id} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-foreground">
                        {cls.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {cls._count.studentEnrollments} / {cls.maxStudents} Mhs
                      </Badge>
                    </div>
                    <CardDescription className="text-xs font-mono">
                      {cls.scheduleDay}, {cls.scheduleTime} • {cls.room || "Lab"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2.5 pt-0">
                    <div className="rounded bg-muted/40 p-2 text-xs">
                      <span className="text-[10px] text-muted-foreground uppercase block font-mono">
                        Asisten Pengampu
                      </span>
                      {cls.assistantAssignments.length === 0 ? (
                        <span className="text-muted-foreground text-[11px]">Belum ditugaskan</span>
                      ) : (
                        <div className="space-y-0.5 mt-0.5">
                          {cls.assistantAssignments.map((a) => (
                            <div key={a.id} className="font-medium text-foreground truncate">
                              {a.assistant.fullName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border/50">
                    <Link
                      href={`/practicums/${practicum.id}/classes/${cls.id}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                        <span>Workspace Kelas & Sesi</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rubric" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Konfigurasi Bobot Penilaian</h3>
              <p className="text-xs text-muted-foreground">
                Total akumulasi bobot saat ini:{" "}
                <span className={`font-mono font-bold ${Math.round(totalWeight) === 100 ? "text-emerald-500" : "text-amber-500"}`}>
                  {totalWeight}% {Math.round(totalWeight) === 100 ? "(Sesuai Target 100%)" : "(Perhatian: Belum 100%)"}
                </span>
              </p>
            </div>
            {canManage && <GradingComponentDialog practicumId={practicum.id} />}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Nama Komponen</TableHead>
                    <TableHead>Bobot (%)</TableHead>
                    <TableHead>Tipe Penilaian</TableHead>
                    <TableHead>Metode Agregasi Sesi</TableHead>
                    <TableHead>Skor Maks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practicum.gradingComponents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Belum ada komponen penilaian diset.
                      </TableCell>
                    </TableRow>
                  ) : (
                    practicum.gradingComponents.map((gc) => (
                      <TableRow key={gc.id}>
                        <TableCell className="font-mono text-xs">{gc.order}</TableCell>
                        <TableCell className="font-semibold text-foreground">{gc.name}</TableCell>
                        <TableCell className="font-mono font-bold text-primary">
                          {Number(gc.weight) * 100}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={gc.isPerSession ? "default" : "outline"} className="text-[10px]">
                            {gc.isPerSession ? "Per-Sesi Pertemuan" : "Tingkat Praktikum"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {gc.aggregationMethod ? (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {gc.aggregationMethod}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{Number(gc.maxScore)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="letters" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tabel Konversi Huruf Mutu</h3>
              <p className="text-xs text-muted-foreground">Standar rentang skor akhir untuk menghasilkan huruf dan bobot mutu.</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Huruf Mutu</TableHead>
                    <TableHead>Rentang Nilai Akhir (Skor)</TableHead>
                    <TableHead>Bobot Angka (Grade Point)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practicum.gradeLetters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Belum ada konversi huruf diset.
                      </TableCell>
                    </TableRow>
                  ) : (
                    practicum.gradeLetters.map((gl) => (
                      <TableRow key={gl.id}>
                        <TableCell className="font-mono font-bold text-base text-primary">
                          {gl.letter}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {Number(gl.minScore).toFixed(2)} — {Number(gl.maxScore).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">
                          {Number(gl.gradePoint).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daftar Penugasan Praktikum</h3>
              <p className="text-xs text-muted-foreground">Tugas, laporan praktikum, kuis & responsi yang dibuka pada praktikum ini.</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul Tugas</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Penalti Terlambat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practicum.assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Belum ada tugas dibuat untuk praktikum ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    practicum.assignments.map((asg) => (
                      <TableRow key={asg.id}>
                        <TableCell className="font-medium text-foreground">{asg.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {asg.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-amber-500">
                          {formatDateTime(asg.deadline)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {asg.latePenaltyPercentage ? `${Number(asg.latePenaltyPercentage)}%` : "Tidak ada"}
                        </TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="outline" className="text-xs h-7">
                            <Link href={`/practicums/${practicum.id}/submissions`}>
                              Lihat Pengumpulan
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PracticumDetailPage({
  params,
}: {
  params: Promise<{ practicumId: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/practicums">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke Katalog Praktikum
          </Link>
        </Button>
      </div>

      <Suspense fallback={<PracticumDetailSkeleton />}>
        <PracticumDetailContent params={params} />
      </Suspense>
    </div>
  );
}
