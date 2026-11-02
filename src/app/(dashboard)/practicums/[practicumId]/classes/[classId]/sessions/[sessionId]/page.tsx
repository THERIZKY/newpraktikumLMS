import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getSessionWorkspace } from "@/server/queries/session.queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkAttendanceTable } from "@/components/sessions/bulk-attendance-table";
import { UploadMaterialDialog } from "@/components/sessions/upload-material-dialog";
import {
  Users,
  FileText,
  ArrowLeft,
  Download,
  FileCheck2,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

const ATTENDANCE_LABEL = {
  PRESENT: { label: "Hadir", variant: "present" },
  LATE: { label: "Terlambat", variant: "late" },
  EXCUSED: { label: "Izin", variant: "excused" },
  ABSENT: { label: "Alpa", variant: "absent" },
} as const;

function SessionWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-10 w-80 rounded-md" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

async function SessionWorkspaceContent({
  params,
}: {
  params: Promise<{
    practicumId: string;
    classId: string;
    sessionId: string;
  }>;
}) {
  await connection();
  const { practicumId, classId, sessionId } = await params;
  const sess = await getSessionWorkspace(sessionId);

  if (!sess) {
    notFound();
  }

  const session = await auth();
  const canManage = ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(
    session?.user?.role || ""
  );

  // Student only sees their own enrollment, never the whole class roster
  const myEnrollment = canManage
    ? undefined
    : sess.practicumClass.studentEnrollments.find(
        (enr) => enr.student.id === session?.user?.id
      );
  const myAttendance = myEnrollment
    ? sess.attendances.find((a) => a.studentEnrollmentId === myEnrollment.id)
    : undefined;

  const attendanceMap = new Map(
    sess.attendances.map((a) => [
      a.studentEnrollmentId,
      { status: a.status, notes: a.notes },
    ])
  );

  const studentRows = sess.practicumClass.studentEnrollments.map((enr) => {
    const existing = attendanceMap.get(enr.id);
    return {
      studentEnrollmentId: enr.id,
      studentId: enr.student.id,
      fullName: enr.student.fullName,
      nim: enr.student.nim,
      status: existing?.status || "PRESENT",
      notes: existing?.notes || "",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href={`/practicums/${practicumId}/classes/${classId}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke {sess.practicumClass.name}
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                Sesi Pertemuan {sess.sessionNumber}
              </Badge>
              <Badge
                variant={
                  sess.status === "COMPLETED"
                    ? "present"
                    : sess.status === "IN_PROGRESS"
                    ? "neonCyan"
                    : "secondary"
                }
                className="text-[10px]"
              >
                {sess.status}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {formatDate(sess.date)} • {sess.startTime} - {sess.endTime}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {sess.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sess.practicumClass.practicum.name} — <span className="font-semibold text-foreground">{sess.practicumClass.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManage && <UploadMaterialDialog sessionId={sess.id} />}
          </div>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="attendance" className="text-xs flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {canManage ? `Presensi Pertemuan (${studentRows.length})` : "Kehadiran Saya"}
          </TabsTrigger>
          <TabsTrigger value="materials" className="text-xs flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Modul & Materi ({sess.materials.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5" />
            Tugas Sesi ({sess.assignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          {canManage ? (
            <>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Lembar Presensi Mahasiswa Praktikan</h3>
                <p className="text-xs text-muted-foreground">
                  Catat status kehadiran per mahasiswa. Gunakan tombol &ldquo;Tandai Semua Hadir&rdquo; untuk efisiensi di laboratorium.
                </p>
              </div>

              <BulkAttendanceTable sessionId={sess.id} students={studentRows} />
            </>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Status Kehadiran Saya</h3>
                <p className="text-xs text-muted-foreground">
                  Kehadiran dicatat oleh asisten praktikum. Hubungi asisten jika status tidak sesuai.
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  {!myEnrollment ? (
                    <p className="text-xs text-muted-foreground">
                      Anda tidak terdaftar sebagai praktikan aktif di kelas ini.
                    </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{myEnrollment.student.fullName}</p>
                        <p className="text-xs font-mono text-muted-foreground">{myEnrollment.student.nim}</p>
                        {myAttendance?.notes && (
                          <p className="text-xs text-muted-foreground mt-2">Keterangan: {myAttendance.notes}</p>
                        )}
                      </div>
                      {myAttendance ? (
                        <Badge
                          variant={ATTENDANCE_LABEL[myAttendance.status].variant}
                          className="text-sm px-3 py-1"
                        >
                          {ATTENDANCE_LABEL[myAttendance.status].label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          Belum Dicatat
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Modul & Dokumen Pedoman</h3>
              <p className="text-xs text-muted-foreground">Unduh file materi panduan praktikum dan starter code untuk pertemuan ini.</p>
            </div>
            {canManage && <UploadMaterialDialog sessionId={sess.id} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sess.materials.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                <FileText className="mx-auto h-7 w-7 mb-2 opacity-40 text-primary" />
                <p className="text-xs font-medium">Belum ada modul materi diunggah untuk sesi ini.</p>
              </div>
            ) : (
              sess.materials.map((mat) => (
                <Card key={mat.id} className="p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {(mat.fileSize / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(mat.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                      {mat.title}
                    </h4>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">
                      {mat.fileName}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/40 mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Oleh: {mat.uploader.fullName}
                    </span>
                    <a
                      href={`/api/materials/${mat.id}/download`}
                      download={mat.fileName}
                      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Unduh
                    </a>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tugas Terikat Sesi Ini</h3>
              <p className="text-xs text-muted-foreground">Pengumpulan laporan mingguan atau tugas kuis yang berhubungan dengan sesi ini.</p>
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
                    <TableHead>Pengumpulan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sess.assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Belum ada tugas khusus yang terikat pada sesi pertemuan ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sess.assignments.map((asg) => (
                      <TableRow key={asg.id}>
                        <TableCell className="font-semibold text-foreground">{asg.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {asg.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-amber-500">
                          {formatDateTime(asg.deadline)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {asg._count.submissions} Mahasiswa
                        </TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="outline" className="text-xs h-7">
                            <Link href={canManage ? `/practicums/${practicumId}/submissions` : "/submissions"}>
                              {canManage ? "Review Pengumpulan" : "Kumpulkan Tugas"}
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

export default function SessionWorkspacePage({
  params,
}: {
  params: Promise<{
    practicumId: string;
    classId: string;
    sessionId: string;
  }>;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-3">
        <Badge variant="outline" className="text-[10px] font-mono">
          WORKSPACE SESI PERTEMUAN & PRESENSI BULK
        </Badge>
      </div>

      <Suspense fallback={<SessionWorkspaceSkeleton />}>
        <SessionWorkspaceContent params={params} />
      </Suspense>
    </div>
  );
}
