import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getClassWithDetails } from "@/server/queries/session.queries";
import { getAvailableStudentsForClass, getAvailableAssistantsForClass } from "@/server/queries/practicum.queries";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrollStudentDialog } from "@/components/classes/enroll-student-dialog";
import { AssignAssistantDialog } from "@/components/classes/assign-assistant-dialog";
import {
  CalendarDays,
  Users,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

function ClassWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-10 w-80 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </div>
    </div>
  );
}

async function ClassWorkspaceContent({
  params,
}: {
  params: Promise<{ practicumId: string; classId: string }>;
}) {
  await connection();
  const { practicumId, classId } = await params;
  const pClass = await getClassWithDetails(classId);

  if (!pClass) {
    notFound();
  }

  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (userRole === "LAB_ADMIN" && pClass.practicum.laboratory.adminId !== userId) {
    redirect("/practicums");
  }
  if (
    userRole === "ASSISTANT" &&
    !pClass.assistantAssignments.some((a) => a.assistant.id === userId)
  ) {
    redirect("/practicums");
  }
  if (
    userRole === "STUDENT" &&
    !pClass.studentEnrollments.some((e) => e.student.id === userId)
  ) {
    redirect("/practicums");
  }

  const canManage = ["SYSTEM_ADMIN", "LAB_ADMIN"].includes(userRole || "");

  const availableStudents = canManage ? await getAvailableStudentsForClass(classId) : [];
  const availableAssistants = canManage ? await getAvailableAssistantsForClass(classId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href={`/practicums/${practicumId}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke {pClass.practicum.name}
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                {pClass.practicum.code}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {pClass.scheduleDay}, {pClass.scheduleTime}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Ruang: {pClass.room || "Lab Utama"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {pClass.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mata Praktikum: <span className="font-semibold text-foreground">{pClass.practicum.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs px-3 py-1.5">
              Kapasitas: {pClass.studentEnrollments.length} / {pClass.maxStudents} Praktikan
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sessions" className="text-xs flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Jadwal Sesi Pertemuan ({pClass.sessions.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Praktikan Terdaftar ({pClass.studentEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="assistants" className="text-xs flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Asisten Kelas ({pClass.assistantAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daftar Sesi Pertemuan Praktikum</h3>
              <p className="text-xs text-muted-foreground">Pilih sesi untuk membuka workspace presensi bulk, modul PDF, dan penugasan sesi.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pClass.sessions.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                <CalendarDays className="mx-auto h-7 w-7 mb-2 opacity-40 text-primary" />
                <p className="text-xs font-medium">Belum ada sesi pertemuan dijadwalkan.</p>
              </div>
            ) : (
              pClass.sessions.map((sess) => (
                <Card
                  key={sess.id}
                  className="flex flex-col justify-between hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs font-semibold text-primary">
                        Sesi {sess.sessionNumber}
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
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground mt-2">
                      {sess.title}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">
                      {formatDate(sess.date)} • {sess.startTime} - {sess.endTime}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2 pt-0 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px] bg-muted/30 p-2 rounded">
                      <span>{sess.materials.length} Modul Materi</span>
                      <span>•</span>
                      <span>{sess.assignments.length} Tugas Sesi</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border/50">
                    <Link
                      href={`/practicums/${practicumId}/classes/${classId}/sessions/${sess.id}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                        <span>Workspace Sesi & Presensi</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daftar Praktikan Terdaftar</h3>
              <p className="text-xs text-muted-foreground">Kapasitas: {pClass.studentEnrollments.length} dari {pClass.maxStudents} mahasiswa.</p>
            </div>
            {canManage && (
              <EnrollStudentDialog
                practicumClassId={pClass.id}
                students={availableStudents}
              />
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>No. HP / WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pClass.studentEnrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Belum ada praktikan terdaftar di kelas ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pClass.studentEnrollments.map((enr, idx) => (
                      <TableRow key={enr.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {enr.student.nim || "-"}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-foreground">
                          {enr.student.fullName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {enr.student.email || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {enr.student.phone || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistants" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Asisten Pengampu Kelas</h3>
              <p className="text-xs text-muted-foreground">Asisten bertugas memimpin praktikum, mencatat kehadiran, dan menilai tugas.</p>
            </div>
            {canManage && (
              <AssignAssistantDialog
                practicumClassId={pClass.id}
                assistants={availableAssistants}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pClass.assistantAssignments.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                <ShieldCheck className="mx-auto h-7 w-7 mb-2 opacity-40 text-primary" />
                <p className="text-xs font-medium">Belum ada asisten ditugaskan untuk kelas ini.</p>
              </div>
            ) : (
              pClass.assistantAssignments.map((a) => (
                <Card key={a.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {a.assistant.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground">
                        {a.assistant.fullName}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {a.assistant.nim || a.assistant.email}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Asprak
                  </Badge>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ClassWorkspacePage({
  params,
}: {
  params: Promise<{ practicumId: string; classId: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-3">
        <Badge variant="outline" className="text-[10px] font-mono">
          WORKSPACE KELAS & JADWAL SESI
        </Badge>
      </div>

      <Suspense fallback={<ClassWorkspaceSkeleton />}>
        <ClassWorkspaceContent params={params} />
      </Suspense>
    </div>
  );
}
