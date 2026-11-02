import Link from "next/link";
import { getAssistantStats } from "@/server/queries/dashboard.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileCheck2,
  CalendarDays,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

export async function AssistantDashboard({ assistantId }: { assistantId: string }) {
  const stats = await getAssistantStats(assistantId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-lg border border-neon-cyan/40 bg-card p-6 shadow-sm neon-border-cyan">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="neonCyan" className="text-[10px]">
                TEACHING ASSISTANT
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Workspace Presensi & Evaluasi
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans">
              Assistant Workspace
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jadwal sesi pertemuan, presensi bulk, antrean review tugas ber-versi & input nilai.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="text-xs bg-neon-cyan/90 text-black hover:bg-neon-cyan">
              <Link href="/submissions">
                <FileCheck2 className="h-3.5 w-3.5 mr-1" />
                Periksa Tugas Mahasiswa
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Kelas Diampu
            </CardTitle>
            <div className="p-2 rounded bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers">
              {stats.assignedClasses.length} Kelas
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {stats.totalStudents} Praktikan Terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Tugas Menunggu Review
            </CardTitle>
            <div className="p-2 rounded bg-amber-500/10 text-amber-500">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers text-amber-500">
              {stats.pendingSubmissions.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Antrean Versi Laporan & Revisi
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Status Asistensi
            </CardTitle>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers text-emerald-500">
              Aktif
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Presensi & Penilaian Terbuka
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Assigned Classes & Pending Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Diampu */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Kelas Praktikum Anda
            </CardTitle>
            <CardDescription className="text-xs">
              Pilih kelas untuk mengelola sesi pertemuan & presensi praktikan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.assignedClasses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Anda belum ditugaskan mengampu kelas praktikum apapun.
              </p>
            ) : (
              stats.assignedClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="rounded border border-border/60 p-4 hover:border-primary/50 transition-colors bg-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-[10px] font-mono mb-1">
                        {cls.practicum.code}
                      </Badge>
                      <h4 className="text-xs font-semibold text-foreground">
                        {cls.practicum.name} — {cls.name}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {cls.scheduleDay}, {cls.scheduleTime}
                        </span>
                        <span>•</span>
                        <span>{cls.room || "Lab Utama"}</span>
                      </div>
                    </div>

                    <Button asChild size="sm" variant="outline" className="text-xs h-8">
                      <Link href={`/practicums/${cls.practicumId}/classes/${cls.id}`}>
                        Buka Kelas
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Submissions Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-amber-500" />
              Antrean Pengumpulan Tugas
            </CardTitle>
            <CardDescription className="text-xs">
              Tugas mahasiswa yang baru dikumpulkan atau memerlukan evaluasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead>Tugas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.pendingSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                      Semua tugas mahasiswa telah selesai diperiksa!
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.pendingSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">
                          {sub.studentEnrollment.student.fullName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {sub.studentEnrollment.student.nim}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{sub.assignment.title}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sub.status === "LATE" ? "late" : "secondary"}
                          className="text-[10px]"
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
