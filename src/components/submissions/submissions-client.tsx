"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmissionDrawer, SubmissionDetails } from "@/components/submissions/submission-drawer";
import { StudentUploadDialog } from "@/components/submissions/student-upload-dialog";
import { toast } from "sonner";
import {
  FileCheck2,
  Search,
  ExternalLink,
  UploadCloud,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export interface StudentActiveAssignment {
  assignmentId: string;
  title: string;
  description?: string | null;
  type: string;
  deadline: Date | string;
  maxFileSizeMb: number;
  allowedFileTypes: string[];
  practicumCode: string;
  practicumName: string;
  className: string;
  sessionNumber: number | null;
  studentEnrollmentId: string;
  submissionId: string | null;
  status: string;
  submittedAt: Date | string | null;
  reviewNotes: string | null;
  latestVersion: number;
}

export function SubmissionsClient({
  submissions,
  canReview,
  studentAssignments,
}: {
  submissions: SubmissionDetails[];
  canReview: boolean;
  studentAssignments?: StudentActiveAssignment[];
}) {
  const router = useRouter();
  const [selectedSub, setSelectedSub] = React.useState<SubmissionDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.studentName.toLowerCase().includes(q) ||
      (s.studentNim && s.studentNim.toLowerCase().includes(q)) ||
      s.assignmentTitle.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenReview = (sub: SubmissionDetails) => {
    setSelectedSub(sub);
    setDrawerOpen(true);
  };

  // Compute Bento metrics
  const totalCount = studentAssignments
    ? studentAssignments.length
    : submissions.length;
  const acceptedCount = submissions.filter((s) => s.status === "ACCEPTED").length;
  const revisionCount = submissions.filter(
    (s) => s.status === "REVISION_REQUESTED"
  ).length;
  const lateCount = submissions.filter((s) => s.status === "LATE").length;
  const onTimeRate =
    submissions.length > 0
      ? (((submissions.length - lateCount) / submissions.length) * 100).toFixed(1)
      : "100.0";

  const urgentRevisionSub = submissions.find(
    (s) => s.status === "REVISION_REQUESTED"
  );

  return (
    <div className="space-y-6">
      {/* 1. Quick Filter Horizontal Bar (Stitch style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-label">
        {[
          { key: "ALL", label: "Semua Tugas", count: submissions.length },
          {
            key: "REVISION_REQUESTED",
            label: "Perlu Revisi",
            count: revisionCount,
          },
          {
            key: "SUBMITTED",
            label: "Sudah Dikumpulkan",
            count: submissions.filter((s) => s.status === "SUBMITTED").length,
          },
          {
            key: "ACCEPTED",
            label: "Selesai / Disetujui",
            count: acceptedCount,
          },
          { key: "LATE", label: "Terlambat", count: lateCount },
        ].map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-2 rounded-lg whitespace-nowrap font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                active
                  ? "bg-primary/15 text-primary border-primary/50 shadow-[0_0_12px_rgba(255,45,120,0.18)]"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  active
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. 4 Bento Stat Cards (Stitch Tugas & Pengumpulan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative bg-card p-5 rounded-xl border border-border flex flex-col justify-between overflow-hidden hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground font-label text-xs uppercase tracking-wider">
            <span>{canReview ? "Total Berkas" : "Tugas Aktif"}</span>
            <FileCheck2 className="h-4 w-4 text-primary" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-foreground tabular-numbers">
              {totalCount}
            </span>
            <span className="text-xs font-mono text-primary">Modul</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>{submissions.length} Terkumpul</span>
            <span>•</span>
            <span className="text-primary font-semibold">
              {revisionCount} Revisi
            </span>
          </div>
        </div>

        <div className="relative bg-card p-5 rounded-xl border border-border flex flex-col justify-between overflow-hidden hover:border-secondary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground font-label text-xs uppercase tracking-wider">
            <span>Tepat Waktu</span>
            <Clock className="h-4 w-4 text-secondary" />
          </div>
          <div className="my-2.5 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-headline font-bold text-secondary tabular-numbers">
                {onTimeRate}
              </span>
              <span className="text-sm font-mono text-secondary">%</span>
            </div>
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${Number(onTimeRate)}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground">
            {submissions.length - lateCount} dari {submissions.length} submisi on-time
          </p>
        </div>

        <div className="relative bg-card p-5 rounded-xl border border-border flex flex-col justify-between overflow-hidden hover:border-neon-yellow/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground font-label text-xs uppercase tracking-wider">
            <span>Disetujui</span>
            <CheckCircle2 className="h-4 w-4 text-neon-yellow" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-foreground tabular-numbers">
              {acceptedCount}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Tugas Lolos
            </span>
          </div>
          <p className="text-[11px] font-mono text-neon-yellow">
            Terverifikasi Asisten Lab
          </p>
        </div>

        <div className="relative bg-card p-5 rounded-xl border border-border flex flex-col justify-between overflow-hidden hover:border-neon-purple/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground font-label text-xs uppercase tracking-wider">
            <span>Keterlambatan</span>
            <AlertTriangle className="h-4 w-4 text-neon-purple" />
          </div>
          <div className="my-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-headline font-bold text-foreground tabular-numbers">
              {lateCount}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Berkas
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>
              {lateCount === 0
                ? "Bebas Penalti Nilai Praktikum"
                : "Perhatikan batas waktu"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. High-Priority Revision Callout (Stitch Section: Perhatian Khusus) */}
      {urgentRevisionSub && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              <h2 className="text-xs font-label uppercase tracking-widest font-bold">
                Perhatian Khusus // Butuh Tindakan Segera
              </h2>
            </div>
            <span className="text-xs font-mono text-neon-yellow">
              STATUS: REVISION_REQUESTED
            </span>
          </div>

          <div className="relative rounded-xl bg-card border border-primary/40 p-5 sm:p-6 shadow-[0_0_25px_rgba(255,45,120,0.14)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-neon-yellow to-secondary" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neonPink" className="font-mono text-[10px]">
                    MINTA REVISI v{(urgentRevisionSub.versions[0]?.versionNumber || 1) + 1}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    Praktikan: {urgentRevisionSub.studentName}
                  </span>
                </div>
                <h3 className="text-lg font-headline font-bold text-foreground">
                  {urgentRevisionSub.assignmentTitle}
                </h3>
                {urgentRevisionSub.reviewNotes && (
                  <p className="text-xs text-muted-foreground bg-surface-low p-3 rounded-lg border border-border">
                    “{urgentRevisionSub.reviewNotes}”
                  </p>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => handleOpenReview(urgentRevisionSub)}
                className="shrink-0 bg-primary text-primary-foreground font-semibold shadow-[0_0_16px_rgba(255,45,120,0.4)]"
              >
                <UploadCloud className="h-4 w-4 mr-1.5" />
                {canReview ? "Periksa Revisi" : "Unggah Revisi Baru"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Student Active Assignments Grid (Allows 1-click v1/v2 submission) */}
      {studentAssignments && studentAssignments.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-headline font-bold text-foreground flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-secondary" />
              Daftar Penugasan Praktikum Aktif
            </h2>
            <p className="text-xs text-muted-foreground">
              Unggah berkas laporan pertama Anda (v1) atau tambahkan versi perbaikan baru (v2, v3...) sebelum tenggat waktu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentAssignments.map((asg) => {
              const nextVer = asg.latestVersion + 1;
              const existingSub = submissions.find(
                (s) => s.assignmentId === asg.assignmentId
              );

              return (
                <div
                  key={asg.assignmentId}
                  className="bg-card rounded-xl p-5 border border-border hover:border-secondary/50 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="neonCyan" className="font-mono text-[10px]">
                            {asg.type}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {asg.practicumCode} • {asg.className}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-headline font-bold text-foreground">
                          {asg.title}
                        </h3>
                      </div>
                      {asg.sessionNumber && (
                        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                          Sesi {asg.sessionNumber}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface-low border border-border/60 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">
                          Tenggat Kumpul
                        </span>
                        <span className="text-neon-yellow font-semibold">
                          {formatDateTime(asg.deadline)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">
                          Status Versi
                        </span>
                        <span className="text-secondary font-semibold">
                          {asg.latestVersion > 0
                            ? `v${asg.latestVersion} (${asg.status})`
                            : "Belum Dikumpulkan"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Maks: 1 MB ({asg.allowedFileTypes.join(", ").toUpperCase()})
                    </span>
                    <div className="flex items-center gap-2">
                      {existingSub && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReview(existingSub)}
                          className="text-xs h-8"
                        >
                          Detail & Riwayat
                        </Button>
                      )}
                      <StudentUploadDialog
                        assignmentId={asg.assignmentId}
                        assignmentTitle={asg.title}
                        currentVersionNumber={asg.latestVersion}
                        triggerButton={
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-primary text-primary-foreground hover:opacity-95"
                          >
                            <UploadCloud className="h-3.5 w-3.5 mr-1" />
                            {asg.latestVersion > 0 ? `Revisi v${nextVer}` : `Unggah v1`}
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Search & Multi-Version Submissions Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari mahasiswa, NIM, atau judul tugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-surface-low h-8"
            />
          </div>

          <span className="text-xs text-muted-foreground font-mono shrink-0">
            Menampilkan {filtered.length} dari {submissions.length} Pengumpulan
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>Tugas Praktikum</TableHead>
                <TableHead>Versi</TableHead>
                <TableHead>Waktu Kumpul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <FileCheck2 className="mx-auto h-7 w-7 mb-2 opacity-40 text-primary" />
                    <p className="text-xs font-medium">Tidak ada data pengumpulan tugas ditemukan.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sub, idx) => {
                  const latestVer = sub.versions[0]?.versionNumber || 1;
                  return (
                    <TableRow key={sub.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground">{sub.studentName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {sub.studentNim || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {sub.assignmentTitle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neonCyan" className="font-mono text-[10px] font-bold">
                          v{latestVer} ({sub.versions.length} total)
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(sub.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === "ACCEPTED"
                              ? "present"
                              : sub.status === "REVISION_REQUESTED"
                              ? "late"
                              : sub.status === "REJECTED"
                              ? "absent"
                              : sub.status === "LATE"
                              ? "late"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReview(sub)}
                          className="text-xs h-7"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {canReview ? "Review Tugas" : "Lihat & Unggah Revisi"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <SubmissionDrawer
        submission={selectedSub}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        canReview={canReview}
      />
    </div>
  );
}

