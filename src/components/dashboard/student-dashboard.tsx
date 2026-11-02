import Link from "next/link";
import { getStudentStats } from "@/server/queries/dashboard.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  Download,
  AlertTriangle,
  Megaphone,
  Keyboard,
  Sparkles,
  CalendarDays,
  History,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export async function StudentDashboard({
  studentId,
  fullName = "Mahasiswa Praktikan",
  nim = "-",
}: {
  studentId: string;
  fullName?: string;
  nim?: string;
}) {
  const stats = await getStudentStats(studentId);

  const allSubmissions = stats.enrollments.flatMap((e) => e.submissions);
  const revisionSubmissions = allSubmissions.filter(
    (s) => s.status === "REVISION_REQUESTED"
  );

  // Compute cumulative GPA from published grades (or default 3.85 preview)
  const publishedGrades = stats.enrollments
    .map((e) => e.publishedGrade)
    .filter((g): g is NonNullable<typeof g> => Boolean(g));
  const avgGpa =
    publishedGrades.length > 0
      ? (
          publishedGrades.reduce((acc, g) => acc + Number(g.gradePoint), 0) /
          publishedGrades.length
        ).toFixed(2)
      : "3.85";

  const uniqueLabsCount = new Set(
    stats.enrollments.map((e) => e.practicumClass.practicum.laboratoryId)
  ).size;

  return (
    <div className="space-y-6">
      {/* 1. Hero Welcome Banner & Quick Academic Status (Stitch Portal Praktikan) */}
      <section className="relative overflow-hidden rounded-xl bg-card border border-primary/40 p-6 sm:p-7 shadow-[0_0_24px_rgba(255,45,120,0.12)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 font-mono text-[11px] text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                Semester Genap 2026/2027 • Status: Praktikan Aktif
              </span>
              <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
                SYNC_OK // LATENCY 12ms
              </span>
            </div>

            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
              Halo, {fullName}{" "}
              <span className="text-primary font-mono text-lg sm:text-xl">
                (NIM: {nim})
              </span>{" "}
              ⚡
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Selamat datang kembali di konsol akademik laboratorium. Anda memiliki{" "}
              <span className="text-primary font-semibold">
                {stats.upcomingAssignments.length} tenggat laporan praktikum
              </span>{" "}
              aktif dan{" "}
              <span className="text-secondary font-semibold">
                {revisionSubmissions.length} pengumpulan tugas
              </span>{" "}
              yang memerlukan tindak lanjut revisi.
            </p>
          </div>

          {/* Right Quick Academic Standing Pill */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-surface-low/90 border border-border rounded-xl p-4 shrink-0">
            <div className="flex flex-col">
              <span className="font-label text-[10px] text-muted-foreground uppercase tracking-wider">
                Indeks Prestasi Praktikum
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-headline font-bold text-2xl text-secondary drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                  {avgGpa}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  / 4.00
                </span>
              </div>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-label text-[10px] text-muted-foreground uppercase tracking-wider">
                Status Akademik
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Sparkles className="h-4 w-4 text-neon-yellow" />
                <span className="font-headline font-semibold text-xs text-foreground">
                  Kehadiran {stats.attendanceSummary.rate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bento Summary Metrics (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Praktikum Aktif */}
        <Card className="bg-card border-secondary/30 hover:border-secondary transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-label text-xs text-muted-foreground uppercase tracking-wider">
              Praktikum Aktif
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {stats.enrollments.length}
              </span>
              <span className="font-mono text-xs text-secondary">Kelas Shift</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-[11px] font-mono">
              <span className="text-muted-foreground">
                {uniqueLabsCount} Laboratorium
              </span>
              <Badge variant="neonCyan" className="text-[10px] px-1.5 py-0">
                Semua Terdaftar
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Tugas Menunggu */}
        <Card className="bg-card border-primary/30 hover:border-primary transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-label text-xs text-muted-foreground uppercase tracking-wider">
              Tugas Menunggu
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {stats.upcomingAssignments.length}
              </span>
              <span className="font-mono text-xs text-primary">Laporan</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-[11px] font-mono">
              <span className="text-muted-foreground">Tenggat Terdekat</span>
              <Badge variant="neonPink" className="text-[10px] px-1.5 py-0">
                {stats.upcomingAssignments.length > 0 ? " Segera Kumpul" : "Aman"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Tingkat Kehadiran */}
        <Card className="bg-card border-neon-purple/30 hover:border-neon-purple transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-label text-xs text-muted-foreground uppercase tracking-wider">
              Tingkat Kehadiran
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {stats.attendanceSummary.rate}%
              </span>
              <span className="font-mono text-xs text-neon-purple">Valid</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-[11px] font-mono">
              <span className="text-muted-foreground">
                {stats.attendanceSummary.present} Hadir • {stats.attendanceSummary.late} Terlambat
              </span>
              <span className="text-secondary">Syarat &gt; 80%</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Revisi Tugas */}
        <Card className="bg-card border-neon-yellow/30 hover:border-neon-yellow transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-label text-xs text-muted-foreground uppercase tracking-wider">
              Revisi Tugas
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center text-neon-yellow">
              <History className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-3xl text-foreground tabular-numbers">
                {revisionSubmissions.length}
              </span>
              <span className="font-mono text-xs text-neon-yellow">Versi Baru</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-[11px] font-mono">
              <span className="text-muted-foreground">
                {allSubmissions.length} Total Submisi
              </span>
              <span className="text-neon-yellow">
                {revisionSubmissions.length > 0 ? "Perlu Revisi" : "Terkendali"}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Main Split Grid (8 Cols Enrolled Practicum Cards + 4 Cols Deadlines & Announcements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mata Praktikum Terdaftar (8 Cols) */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary" />
              <h2 className="font-headline font-bold text-lg text-foreground tracking-tight">
                Mata Praktikum Terdaftar
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                Filter:
              </span>
              <Badge variant="neonCyan" className="font-mono text-[11px]">
                Semester Aktif ({stats.enrollments.length})
              </Badge>
            </div>
          </div>

          {stats.enrollments.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <p className="text-xs">
                Anda belum terdaftar pada mata praktikum aktif manapun.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {stats.enrollments.map((enr, index) => {
                const practicum = enr.practicumClass.practicum;
                const sessions = enr.practicumClass.sessions;
                const totalSessions = practicum.totalSessions || sessions.length || 10;
                const activeOrCompletedCount =
                  sessions.filter(
                    (s) => s.status === "COMPLETED" || s.status === "IN_PROGRESS"
                  ).length || 1;
                const progressPct = Math.min(
                  100,
                  Math.round((activeOrCompletedCount / totalSessions) * 100)
                );

                const activeSession =
                  sessions.find((s) => s.status === "IN_PROGRESS") ||
                  sessions[0];
                const latestMaterial = activeSession?.materials?.[0];
                const assistants =
                  enr.practicumClass.assistantAssignments
                    .map((a) => a.assistant.fullName)
                    .join(", ") || "Tim Asisten Lab";
                const labHead =
                  practicum.laboratory.admin?.fullName || "Kepala Laboratorium";

                const isPinkAccent = index % 2 === 1;

                return (
                  <article
                    key={enr.id}
                    className={`rounded-xl bg-card border ${
                      isPinkAccent
                        ? "border-primary/40 hover:border-primary"
                        : "border-secondary/40 hover:border-secondary"
                    } p-5 sm:p-6 flex flex-col gap-4 transition-all relative overflow-hidden`}
                  >
                    {/* Top Neon Accent Strip */}
                    <div
                      className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                        isPinkAccent
                          ? "from-primary via-neon-purple to-secondary"
                          : "from-secondary via-neon-purple to-primary"
                      }`}
                    />

                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={isPinkAccent ? "neonPink" : "neonCyan"}
                            className="font-mono text-[11px] font-bold"
                          >
                            {practicum.code}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-[11px]">
                            {enr.practicumClass.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            • {practicum.laboratory.name}
                          </span>
                        </div>
                        <h3 className="font-headline font-bold text-lg text-foreground">
                          {practicum.name}
                        </h3>
                      </div>

                      <Badge
                        variant={
                          activeSession?.status === "IN_PROGRESS"
                            ? "neonCyan"
                            : "outline"
                        }
                        className="self-start shrink-0 font-mono text-[10px]"
                      >
                        {activeSession
                          ? `SESI ${activeSession.sessionNumber}: ${activeSession.status}`
                          : "TERJADWAL"}
                      </Badge>
                    </div>

                    {/* Syllabus Session Progress Bar */}
                    <div className="bg-surface-low p-3.5 rounded-lg border border-border/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-label text-muted-foreground font-medium">
                          Progres Silabus Pertemuan
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          <strong className="text-secondary font-semibold">
                            Sesi {activeOrCompletedCount}
                          </strong>{" "}
                          dari {totalSessions} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden p-0.5 border border-border">
                        <div
                          className="bg-gradient-to-r from-secondary via-neon-purple to-primary h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* 3-Column Metadata Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2 text-xs border-t border-b border-border/60">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground font-label text-[10px] uppercase tracking-wider">
                          Kepala Lab / Pengampu:
                        </span>
                        <span className="text-foreground font-medium mt-0.5 truncate">
                          {labHead}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground font-label text-[10px] uppercase tracking-wider">
                          Asisten Praktikum (Asprak):
                        </span>
                        <span className="text-secondary font-medium mt-0.5 truncate">
                          {assistants}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground font-label text-[10px] uppercase tracking-wider">
                          Jadwal Praktikum:
                        </span>
                        <span className="text-foreground font-medium mt-0.5 flex items-center gap-1 font-mono text-[11px]">
                          <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                          {enr.practicumClass.scheduleDay},{" "}
                          {enr.practicumClass.scheduleTime}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {latestMaterial ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 bg-surface-low border-border hover:border-secondary hover:text-secondary"
                          >
                            <a
                              href={`/api/materials/${latestMaterial.id}/download`}
                              download={latestMaterial.fileName}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Unduh Modul Sesi {activeSession?.sessionNumber}
                            </a>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 bg-surface-low border-border hover:border-secondary hover:text-secondary"
                          >
                            <Link
                              href={`/practicums/${practicum.id}/classes/${enr.practicumClassId}`}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Materi & Modul Sesi
                            </Link>
                          </Button>
                        )}

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 bg-surface-low border-border hover:border-primary hover:text-primary"
                        >
                          <Link
                            href={`/practicums/${practicum.id}/classes/${enr.practicumClassId}`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            Presensi Saya
                          </Link>
                        </Button>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="text-xs h-8 bg-gradient-to-r from-primary to-neon-purple text-white font-semibold hover:opacity-95 shadow-[0_0_14px_rgba(255,45,120,0.4)]"
                      >
                        <Link
                          href={`/practicums/${practicum.id}/classes/${enr.practicumClassId}`}
                        >
                          Buka Praktikum
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Deadlines Timeline, Revision Callout & Announcements (4 Cols) */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Urgent Deadline Timeline Card */}
          <div className="bg-card rounded-xl border border-primary/40 p-5 space-y-4 shadow-[0_0_20px_rgba(255,45,120,0.1)]">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-headline font-semibold text-base text-foreground">
                  Tenggat Tugas
                </h3>
              </div>
              <Badge variant="neonPink" className="font-mono text-[10px]">
                {stats.upcomingAssignments.length} Aktif
              </Badge>
            </div>

            {stats.upcomingAssignments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Tidak ada tenggat tugas mendesak minggu ini.
              </p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-secondary">
                {stats.upcomingAssignments.map((asg, i) => {
                  const isFirst = i === 0;
                  return (
                    <div key={asg.id} className="flex items-start gap-3 relative">
                      <div
                        className={`w-7 h-7 rounded-full bg-card border-2 ${
                          isFirst
                            ? "border-primary text-primary shadow-[0_0_8px_rgba(255,45,120,0.6)]"
                            : "border-secondary text-secondary shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                        } flex items-center justify-center shrink-0 z-10 text-[10px] font-mono font-bold`}
                      >
                        {i + 1}
                      </div>
                      <div
                        className={`flex flex-col gap-1.5 w-full bg-surface-low p-3.5 rounded-lg border ${
                          isFirst ? "border-primary/35" : "border-secondary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-mono text-[11px] font-semibold ${
                              isFirst ? "text-primary" : "text-secondary"
                            }`}
                          >
                            {asg.practicum.code}
                          </span>
                          <Badge
                            variant={isFirst ? "neonPink" : "neonCyan"}
                            className="text-[9px] px-1.5 py-0 font-mono"
                          >
                            {asg.type}
                          </Badge>
                        </div>
                        <h4 className="font-headline text-xs sm:text-sm text-foreground font-semibold leading-snug">
                          {asg.title}
                        </h4>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3 text-primary shrink-0" />
                          <span>Tenggat: {formatDateTime(asg.deadline)}</span>
                        </div>
                        <div className="pt-2 mt-1 border-t border-border/60 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-neon-yellow">
                            Maks {asg.maxFileSizeMb}MB ({asg.allowedFileTypes.join("/")})
                          </span>
                          <Link
                            href="/submissions"
                            className="font-label text-xs text-primary hover:text-secondary hover:underline inline-flex items-center gap-1 font-semibold transition-colors"
                          >
                            Unggah Versi
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending Revision Callout */}
            {revisionSubmissions.length > 0 && (
              <div className="p-3.5 rounded-lg bg-neon-yellow/10 border border-neon-yellow/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-neon-yellow">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="font-headline text-xs font-bold tracking-wide uppercase">
                    {revisionSubmissions.length} Revisi Perlu Tindakan
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {revisionSubmissions[0].reviewNotes ||
                    `Tugas "${revisionSubmissions[0].assignment.title}" memerlukan perbaikan versi baru sesuai catatan asisten.`}
                </p>
                <Link
                  href="/submissions"
                  className="inline-flex items-center gap-1 font-mono text-xs text-neon-yellow hover:text-primary font-semibold hover:underline pt-1"
                >
                  <span>Buka Slide-Over Review</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Pinned Lab Announcements Card */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-secondary" />
                <h3 className="font-headline font-semibold text-sm text-foreground">
                  Siaran Laboratorium
                </h3>
              </div>
              <Link
                href="/announcements"
                className="font-mono text-[11px] text-secondary hover:underline"
              >
                Semua
              </Link>
            </div>

            {stats.recentAnnouncements.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Belum ada pengumuman terbaru.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.recentAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-lg bg-surface-low border border-border/70 hover:border-secondary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                      <span className="text-secondary font-semibold">
                        {ann.laboratory?.code || "GLOBAL"}
                      </span>
                      <span>{formatDateTime(ann.createdAt)}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                      {ann.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 4. Quick Keyboard Shortcut Banner (Stitch Linear/Vercel style prompt) */}
      <div className="w-full rounded-xl bg-card border border-secondary/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground font-mono text-xs shadow-[0_0_16px_rgba(0,240,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <Keyboard className="h-4 w-4 text-secondary shrink-0" />
          <span className="text-secondary font-semibold">
            Navigasi Cepat Praktikan:
          </span>
          <span className="text-foreground">
            Tekan{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-secondary/40 text-secondary font-bold">
              ⌘K
            </kbd>{" "}
            untuk mencari materi sesi, kode tugas, atau panduan lab.
          </span>
        </div>
        <div className="flex items-center gap-2 text-secondary">
          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_#00f0ff] animate-pulse" />
          <span>Server Sinkronisasi: Aktif</span>
        </div>
      </div>
    </div>
  );
}

