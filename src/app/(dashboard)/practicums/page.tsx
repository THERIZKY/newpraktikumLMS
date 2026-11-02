import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getPracticums } from "@/server/queries/practicum.queries";
import { getActiveLaboratories } from "@/server/queries/announcement.queries";
import { getStudentStats } from "@/server/queries/dashboard.queries";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePracticumDialog } from "@/components/practicums/create-practicum-dialog";
import {
  BookOpen,
  Building2,
  ArrowRight,
  Award,
  CalendarDays,
  Clock,
  Download,
  MapPin,
} from "lucide-react";
import { Semester } from "@prisma/client";
import { formatDate } from "@/lib/utils";

function PracticumsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-8 w-56 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

async function PracticumsContent({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; year?: string }>;
}) {
  await connection();
  const { semester, year } = await searchParams;
  const validSemester =
    semester === "EVEN"
      ? ("EVEN" as Semester)
      : semester === "ODD"
      ? ("ODD" as Semester)
      : undefined;

  const session = await auth();
  const isStudent = session?.user?.role === "STUDENT";
  const isAssistant = session?.user?.role === "ASSISTANT";
  const isLabAdmin = session?.user?.role === "LAB_ADMIN";
  const labAdminId = isLabAdmin ? session.user.id : undefined;
  const canCreate = ["SYSTEM_ADMIN", "LAB_ADMIN"].includes(
    session?.user?.role || ""
  );

  const [practicums, laboratories, studentStats] = await Promise.all([
    getPracticums({
      semester: validSemester,
      academicYear: year,
      adminId: labAdminId,
      assistantId: isAssistant ? session.user.id : undefined,
      studentId: isStudent ? session.user.id : undefined,
    }),
    canCreate ? getActiveLaboratories(labAdminId) : Promise.resolve([]),
    isStudent && session?.user?.id
      ? getStudentStats(session.user.id)
      : Promise.resolve(null),
  ]);

  // Flatten upcoming student sessions for Stitch Jadwal Sesi view
  const upcomingStudentSessions = studentStats
    ? studentStats.enrollments.flatMap((enr) =>
        enr.practicumClass.sessions
          .filter((s) => s.status === "IN_PROGRESS" || s.status === "SCHEDULED")
          .slice(0, 3)
          .map((s) => ({
            ...s,
            practicumId: enr.practicumClass.practicumId,
            classId: enr.practicumClassId,
            practicumCode: enr.practicumClass.practicum.code,
            practicumName: enr.practicumClass.practicum.name,
            className: enr.practicumClass.name,
            labName: enr.practicumClass.practicum.laboratory.name,
            room: enr.practicumClass.room || "Ruang Lab Utama",
            scheduleDay: enr.practicumClass.scheduleDay,
            assistants:
              enr.practicumClass.assistantAssignments
                .map((a) => a.assistant.fullName)
                .join(", ") || "Tim Asisten Lab",
          }))
      )
    : [];

  const nextHeroSession = upcomingStudentSessions[0];

  return (
    <div className="space-y-6">
      {/* Stitch Jadwal Sesi Section for Praktikan (STUDENT) */}
      {isStudent && nextHeroSession && (
        <div className="space-y-6">
          {/* Hero Upcoming Session Card */}
          <article className="relative rounded-xl bg-card border border-primary/35 p-6 sm:p-7 overflow-hidden shadow-[0_0_28px_rgba(255,45,120,0.12)]">
            <div className="absolute -right-16 -top-16 w-52 h-52 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="font-mono text-[10px] uppercase tracking-wider">
                    SESI BERIKUTNYA
                  </Badge>
                  <Badge variant="neonCyan" className="font-mono text-xs">
                    {nextHeroSession.practicumCode} {"//"} {nextHeroSession.className}
                  </Badge>
                </div>
                <span className="font-mono text-xs text-neon-yellow flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  STATUS: {nextHeroSession.status}
                </span>
              </div>

              <div>
                <span className="font-mono text-xs font-semibold text-secondary uppercase tracking-widest">
                  PERTEMUAN 0{nextHeroSession.sessionNumber}
                </span>
                <h2 className="font-headline font-bold text-2xl sm:text-3xl text-foreground tracking-tight mt-1">
                  {nextHeroSession.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
                  {nextHeroSession.description ||
                    `Sesi praktikum terjadwal untuk ${nextHeroSession.practicumName}. Pastikan hadir tepat waktu dan sudah mengunduh modul pertemuan.`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-surface-low p-3.5 rounded-lg border border-border">
                  <span className="block font-label text-[10px] uppercase text-muted-foreground tracking-wider">
                    JADWAL SESI
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-headline font-semibold text-xs sm:text-sm text-foreground">
                    <CalendarDays className="h-4 w-4 text-secondary shrink-0" />
                    <span>
                      {nextHeroSession.scheduleDay}, {formatDate(nextHeroSession.date)}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-secondary block mt-0.5">
                    {nextHeroSession.startTime} - {nextHeroSession.endTime} WIB
                  </span>
                </div>

                <div className="bg-surface-low p-3.5 rounded-lg border border-border">
                  <span className="block font-label text-[10px] uppercase text-muted-foreground tracking-wider">
                    LOKASI LABORATORIUM
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-headline font-semibold text-xs sm:text-sm text-foreground truncate">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{nextHeroSession.labName}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground block mt-0.5">
                    {nextHeroSession.room}
                  </span>
                </div>

                <div className="bg-surface-low p-3.5 rounded-lg border border-border">
                  <span className="block font-label text-[10px] uppercase text-muted-foreground tracking-wider">
                    KOORDINATOR ASPRAK
                  </span>
                  <div className="font-headline font-semibold text-xs sm:text-sm text-foreground mt-1 truncate">
                    {nextHeroSession.assistants}
                  </div>
                  <span className="font-mono text-xs text-secondary block mt-0.5">
                    Presensi Terbuka
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  Kehadiran Praktikan Terverifikasi: <strong className="text-secondary">{studentStats?.attendanceSummary.rate}%</strong>
                </span>
                <div className="flex items-center gap-2">
                  {nextHeroSession.materials?.[0] && (
                    <Button asChild size="sm" variant="outline" className="text-xs h-8">
                      <a
                        href={`/api/materials/${nextHeroSession.materials[0].id}/download`}
                        download={nextHeroSession.materials[0].fileName}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5 text-secondary" />
                        {nextHeroSession.materials[0].fileName}
                      </a>
                    </Button>
                  )}
                  <Button asChild size="sm" className="text-xs h-8">
                    <Link
                      href={`/practicums/${nextHeroSession.practicumId}/classes/${nextHeroSession.classId}/sessions/${nextHeroSession.id}`}
                    >
                      Buka Sesi Pertemuan
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>

          {/* Weekly Agenda Bento Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-secondary" />
                Agenda Sesi Pertemuan Mendatang
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {upcomingStudentSessions.length} Sesi Terjadwal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingStudentSessions.slice(0, 3).map((sess, idx) => (
                <div
                  key={sess.id}
                  className="relative bg-card rounded-xl p-5 border border-border hover:border-secondary/50 transition-all flex flex-col justify-between gap-4"
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 rounded-t-xl bg-gradient-to-r ${
                      idx === 0
                        ? "from-primary to-transparent"
                        : "from-secondary to-transparent"
                    }`}
                  />
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className={idx === 0 ? "text-primary font-bold" : "text-secondary font-bold"}>
                        {sess.scheduleDay.toUpperCase()} • SESI 0{sess.sessionNumber}
                      </span>
                      <Badge
                        variant={sess.status === "IN_PROGRESS" ? "neonCyan" : "outline"}
                        className="text-[9px]"
                      >
                        {sess.status}
                      </Badge>
                    </div>
                    <div className="font-headline font-bold text-base text-foreground mb-1">
                      {sess.startTime} - {sess.endTime} WIB
                    </div>
                    <h4 className="font-headline font-semibold text-sm text-foreground">
                      {sess.practicumCode} — {sess.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sess.room} • {sess.labName}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{formatDate(sess.date)}</span>
                    <Link
                      href={`/practicums/${sess.practicumId}/classes/${sess.classId}/sessions/${sess.id}`}
                      className="text-secondary hover:underline font-semibold"
                    >
                      Detail Sesi →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground font-mono">
          {practicums.length} Mata Praktikum Aktif di Katalog
        </span>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded border border-border/60 bg-muted/30 p-1 text-xs">
            <Link
              href="/practicums"
              className={`rounded px-2.5 py-1 transition-colors ${
                !semester ? "bg-background font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua
            </Link>
            <Link
              href="/practicums?semester=ODD"
              className={`rounded px-2.5 py-1 transition-colors ${
                semester === "ODD" ? "bg-background font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ganjil
            </Link>
            <Link
              href="/practicums?semester=EVEN"
              className={`rounded px-2.5 py-1 transition-colors ${
                semester === "EVEN" ? "bg-background font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Genap
            </Link>
          </div>

          {canCreate && laboratories.length > 0 && (
            <CreatePracticumDialog laboratories={laboratories} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {practicums.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-lg">
            <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-40 text-primary" />
            <p className="text-sm font-medium">Belum ada mata praktikum ditemukan.</p>
            {canCreate && (
              <p className="text-xs mt-1">Buka praktikum baru untuk memulai periode semester ini.</p>
            )}
          </div>
        ) : (
          practicums.map((p) => {
            const totalStudents = p.classes.reduce(
              (acc, c) => acc + c._count.studentEnrollments,
              0
            );

            return (
              <Card
                key={p.id}
                className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-semibold text-primary">
                      {p.code}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {p.academicYear} • {p.semester}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground mt-2">
                    {p.name}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1 text-muted-foreground">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {p.laboratory.name} ({p.laboratory.code})
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.description || "Silabus praktikum, implementasi laporan mingguan, dan evaluasi responsi."}
                  </p>

                  <div className="grid grid-cols-3 gap-2 rounded bg-muted/40 p-2.5 text-center font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">Kelas</span>
                      <span className="font-semibold text-foreground">{p.classes.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">Sesi</span>
                      <span className="font-semibold text-foreground">{p.totalSessions}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase">Praktikan</span>
                      <span className="font-semibold text-emerald-500">{totalStudents}</span>
                    </div>
                  </div>

                  {p.gradingComponents.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-amber-500" />
                          Bobot Penilaian
                        </span>
                        <span className="font-mono font-medium">
                          {p.gradingComponents.length} Komponen
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.gradingComponents.map((gc) => (
                          <Badge
                            key={gc.id}
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0"
                          >
                            {gc.name} ({Number(gc.weight) * 100}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-border/50">
                  <Button asChild variant="outline" size="sm" className="w-full text-xs justify-between">
                    <Link href={`/practicums/${p.id}`}>
                      <span>Detail & Workspace Praktikum</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function PracticumsPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; year?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">
              KURIKULUM AKADEMIK
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Katalog Mata Praktikum
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar seluruh praktikum, pembagian shift kelas, konfigurasi skema penilaian, & modul materi.
          </p>
        </div>
      </div>

      <Suspense fallback={<PracticumsSkeleton />}>
        <PracticumsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
