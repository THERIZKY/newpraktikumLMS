"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { saveBulkAttendanceAction } from "@/server/actions/session.actions";
import { toast } from "sonner";
import { AttendanceStatus } from "@prisma/client";
import { CheckCheck, Save, Loader2 } from "lucide-react";

interface StudentRow {
  studentEnrollmentId: string;
  studentId: string;
  fullName: string;
  nim?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
}

export function BulkAttendanceTable({
  sessionId,
  students,
}: {
  sessionId: string;
  students: StudentRow[];
}) {
  const router = useRouter();
  const [records, setRecords] = React.useState<Record<string, { status: AttendanceStatus; notes: string }>>(
    () => {
      const initial: Record<string, { status: AttendanceStatus; notes: string }> = {};
      students.forEach((s) => {
        initial[s.studentEnrollmentId] = {
          status: s.status || "PRESENT",
          notes: s.notes || "",
        };
      });
      return initial;
    }
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const handleStatusChange = (enrollmentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status,
      },
    }));
  };

  const handleNotesChange = (enrollmentId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        notes,
      },
    }));
  };

  const markAllPresent = () => {
    setRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id].status = "PRESENT";
      });
      return updated;
    });
    toast.info("Seluruh praktikan ditandai HADIR", {
      description: "Silakan ubah status yang izin/terlambat/alpa lalu klik Simpan.",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = Object.entries(records).map(([enrollmentId, data]) => ({
        studentEnrollmentId: enrollmentId,
        status: data.status,
        notes: data.notes || undefined,
      }));

      await saveBulkAttendanceAction({
        sessionId,
        records: payload,
      });

      toast.success("Presensi Berhasil Disimpan", {
        description: `${payload.length} data kehadiran praktikan berhasil dicatat.`,
      });
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan presensi");
    } finally {
      setIsSaving(false);
    }
  };

  // Summary counts
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let absentCount = 0;
  Object.values(records).forEach((r) => {
    if (r.status === "PRESENT") presentCount++;
    else if (r.status === "LATE") lateCount++;
    else if (r.status === "EXCUSED") excusedCount++;
    else if (r.status === "ABSENT") absentCount++;
  });

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border/60">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <Badge variant="present">Hadir: {presentCount}</Badge>
          <Badge variant="late">Terlambat: {lateCount}</Badge>
          <Badge variant="excused">Izin: {excusedCount}</Badge>
          <Badge variant="absent">Alpa: {absentCount}</Badge>
          <span className="text-muted-foreground ml-1">Total: {students.length} Mahasiswa</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllPresent}
            disabled={isSaving || students.length === 0}
            className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            Tandai Semua Hadir
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || students.length === 0}
            className="text-xs font-medium shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Simpan Presensi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table of Students with Attendance Toggles */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead className="w-32">NIM</TableHead>
              <TableHead>Nama Mahasiswa</TableHead>
              <TableHead className="w-80">Status Kehadiran</TableHead>
              <TableHead>Keterangan / Alasan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada praktikan terdaftar di kelas ini.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, idx) => {
                const current = records[student.studentEnrollmentId] || {
                  status: "PRESENT",
                  notes: "",
                };

                return (
                  <TableRow key={student.studentEnrollmentId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-xs text-foreground">
                      {student.nim || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {student.fullName}
                    </TableCell>
                    <TableCell>
                      <ToggleGroup
                        value={current.status}
                        onValueChange={(val) =>
                          handleStatusChange(student.studentEnrollmentId, val as AttendanceStatus)
                        }
                      >
                        <ToggleGroupItem value="PRESENT" statusVariant="present">
                          Hadir
                        </ToggleGroupItem>
                        <ToggleGroupItem value="LATE" statusVariant="late">
                          Terlambat
                        </ToggleGroupItem>
                        <ToggleGroupItem value="EXCUSED" statusVariant="excused">
                          Izin
                        </ToggleGroupItem>
                        <ToggleGroupItem value="ABSENT" statusVariant="absent">
                          Alpa
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Catatan izin / keterlambatan..."
                        value={current.notes}
                        onChange={(e) =>
                          handleNotesChange(student.studentEnrollmentId, e.target.value)
                        }
                        className="h-8 text-xs bg-muted/20"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
