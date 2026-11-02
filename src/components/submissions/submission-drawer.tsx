"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reviewSubmissionAction, submitAssignmentAction } from "@/server/actions/submission.actions";
import { toast } from "sonner";
import { FileText, Download, CheckCircle, AlertTriangle, XCircle, Loader2, UploadCloud } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export interface SubmissionDetails {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  studentNim?: string | null;
  status: string;
  submittedAt: Date | string | null;
  reviewedAt: Date | string | null;
  reviewNotes?: string | null;
  versions: {
    id: string;
    versionNumber: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    revisionNotes?: string | null;
    uploadedAt: Date | string;
  }[];
}

export function SubmissionDrawer({
  submission,
  open,
  onOpenChange,
  canReview,
}: {
  submission: SubmissionDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canReview: boolean;
}) {
  const router = useRouter();
  const [reviewStatus, setReviewStatus] = React.useState<"ACCEPTED" | "REVISION_REQUESTED" | "REJECTED">("ACCEPTED");
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [prevSubmissionId, setPrevSubmissionId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Student new version upload state
  const [file, setFile] = React.useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (submission && submission.id !== prevSubmissionId) {
    setPrevSubmissionId(submission.id);
    setReviewNotes(submission.reviewNotes || "");
    setFile(null);
    setRevisionNotes("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (
      submission.status === "ACCEPTED" ||
      submission.status === "REVISION_REQUESTED" ||
      submission.status === "REJECTED"
    ) {
      setReviewStatus(submission.status);
    } else {
      setReviewStatus("ACCEPTED");
    }
  }

  if (!submission) return null;

  const nextVersionNumber = (submission.versions[0]?.versionNumber || 0) + 1;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await reviewSubmissionAction({
        submissionId: submission.id,
        assignmentId: submission.assignmentId,
        status: reviewStatus,
        reviewNotes,
      });

      toast.success("Review Tugas Berhasil Disimpan", {
        description: `Status telah diubah menjadi ${reviewStatus}.`,
      });
      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB limit

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Ukuran berkas melebihi batas!", {
        description: `Ukuran file Anda (${(selected.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal 1 MB.`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleStudentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih berkas tugas terlebih dahulu.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Ukuran berkas melebihi batas maksimal 1 MB.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", submission.assignmentId);
      if (revisionNotes.trim()) {
        formData.append("revisionNotes", revisionNotes.trim());
      }

      const res = await fetch("/api/submissions/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengunggah berkas");
      }

      toast.success(`Versi v${json.versionNumber || nextVersionNumber} Berhasil Diunggah`, {
        description: `${file.name} telah tercatat pada riwayat pengumpulan.`,
      });
      setFile(null);
      setRevisionNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mengunggah versi tugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              MULTI-VERSION DRAWER
            </Badge>
            <Badge
              variant={
                submission.status === "ACCEPTED"
                  ? "present"
                  : submission.status === "REVISION_REQUESTED"
                  ? "late"
                  : submission.status === "REJECTED"
                  ? "absent"
                  : "secondary"
              }
              className="text-[10px]"
            >
              {submission.status}
            </Badge>
          </div>
          <SheetTitle className="text-base font-bold text-foreground">
            {submission.assignmentTitle}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Praktikan: <span className="font-semibold text-foreground">{submission.studentName}</span>{" "}
            {submission.studentNim && `(${submission.studentNim})`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-4 text-xs">
          {/* Submission Version Timeline */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Riwayat Versi Pengumpulan ({submission.versions.length} Versi)
            </h4>

            {submission.versions.length === 0 ? (
              <div className="rounded border border-dashed border-border p-4 text-center text-muted-foreground">
                Belum ada berkas versi yang diunggah untuk tugas ini.
              </div>
            ) : (
              <div className="space-y-2">
                {submission.versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="rounded-lg border border-border/80 bg-surface-low p-3 hover:border-secondary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="neonCyan" className="font-mono text-xs font-bold">
                        Versi {ver.versionNumber} (v{ver.versionNumber})
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {formatDateTime(ver.uploadedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-medium text-foreground block truncate">
                            {ver.fileName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {(ver.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>

                      <a
                        href={`/api/submissions/${submission.id}/versions/${ver.id}/download`}
                        download={ver.fileName}
                        className="inline-flex items-center gap-1 text-xs text-secondary font-medium hover:underline shrink-0 ml-2"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh
                      </a>
                    </div>

                    {ver.revisionNotes && (
                      <div className="mt-2 rounded bg-background/60 p-2 text-[11px] text-muted-foreground border border-border/40">
                        <span className="font-semibold block text-foreground">Catatan Mahasiswa:</span>
                        {ver.revisionNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assistant Review Form OR Student Multi-Version Upload Form */}
          {canReview ? (
            <form onSubmit={handleReviewSubmit} className="space-y-3 pt-3 border-t border-border/60">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                Form Penilaian & Umpan Balik Asisten
              </h4>

              <div className="space-y-1.5">
                <Label htmlFor="review-status">Keputusan Review</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus("ACCEPTED")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
                      reviewStatus === "ACCEPTED"
                        ? "bg-secondary/20 border-secondary text-secondary font-bold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    ACCEPTED
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus("REVISION_REQUESTED")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
                      reviewStatus === "REVISION_REQUESTED"
                        ? "bg-neon-yellow/20 border-neon-yellow text-neon-yellow font-bold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    REVISI
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus("REJECTED")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
                      reviewStatus === "REJECTED"
                        ? "bg-destructive/20 border-destructive text-destructive font-bold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    REJECTED
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review-notes">Catatan & Koreksi Reviewer</Label>
                <textarea
                  id="review-notes"
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Jelaskan aspek yang perlu direvisi atau berikan apresiasi hasil tugas..."
                  className="w-full rounded border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button type="submit" size="sm" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Menyimpan Keputusan...
                  </>
                ) : (
                  "Simpan Keputusan Review"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 pt-3 border-t border-border/60">
              {submission.reviewNotes && (
                <div className="rounded-lg border border-neon-yellow/40 bg-neon-yellow/10 p-3.5">
                  <span className="font-semibold block text-neon-yellow font-mono text-[11px] uppercase">
                    Catatan & Umpan Balik Asisten:
                  </span>
                  <p className="mt-1 text-foreground leading-relaxed">{submission.reviewNotes}</p>
                </div>
              )}

              <form onSubmit={handleStudentUpload} className="space-y-3 rounded-xl border border-primary/35 bg-surface-low p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4 text-primary" />
                    Unggah Versi Baru (v{nextVersionNumber})
                  </h4>
                  <Badge variant="neonPink" className="font-mono text-[10px]">
                    Target: v{nextVersionNumber}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="student-file-input">Pilih Berkas Tugas</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Maksimal: 1 MB
                    </span>
                  </div>
                  <Input
                    id="student-file-input"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="h-9 text-xs cursor-pointer file:cursor-pointer file:text-xs file:font-semibold file:text-primary bg-background"
                    required
                  />
                  {file && (
                    <div className="flex items-center justify-between p-2 rounded bg-surface border border-border text-[11px] font-mono">
                      <span className="truncate max-w-[280px] text-foreground">{file.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {(file.size / 1024).toFixed(1)} KB / 1024 KB
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="student-rev-notes">Catatan Perbaikan / Commit Message</Label>
                  <textarea
                    id="student-rev-notes"
                    rows={3}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Jelaskan perubahan atau revisi yang dilakukan pada versi ini..."
                    className="w-full rounded border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Mengunggah v{nextVersionNumber}...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                      Kirim Pengumpulan v{nextVersionNumber}
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

