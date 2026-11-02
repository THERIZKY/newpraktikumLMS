"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileUp, Loader2, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE_MB = 1; // Explicit 1MB frontend limit as requested
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function StudentUploadDialog({
  assignmentId,
  assignmentTitle,
  currentVersionNumber,
  triggerButton,
}: {
  assignmentId: string;
  assignmentTitle: string;
  currentVersionNumber?: number;
  triggerButton?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const nextVersion = (currentVersionNumber || 0) + 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Ukuran berkas melebihi batas!", {
        description: `Ukuran file Anda (${(selected.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih berkas tugas terlebih dahulu.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Ukuran berkas melebihi batas maksimal ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
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

      toast.success(
        json.status === "LATE"
          ? "Tugas Terkumpul (Terlambat)"
          : "Tugas Berhasil Terkumpul Tepat Waktu",
        {
          description: `Versi v${json.versionNumber || nextVersion} (${file.name}) berhasil diunggah.`,
        }
      );

      setOpen(false);
      setFile(null);
      setRevisionNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mengunggah tugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="text-xs">
            <Upload className="h-3.5 w-3.5 mr-1" />
            {currentVersionNumber ? `Unggah Revisi (v${nextVersion})` : "Kumpulkan Tugas"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-primary" />
              Pengumpulan Tugas ({assignmentTitle})
            </DialogTitle>
            <DialogDescription>
              {currentVersionNumber ? (
                <span>
                  Mengunggah perbaikan tugas sebagai{" "}
                  <strong className="text-foreground">
                    Versi {nextVersion} (v{nextVersion})
                  </strong>{" "}
                  tanpa menghapus riwayat versi sebelumnya.
                </span>
              ) : (
                "Unggah file laporan atau tugas Anda ke sistem LMS praktikum."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="upload-file">Pilih Berkas Tugas</Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Maksimal: {MAX_FILE_SIZE_MB} MB
                </span>
              </div>
              <Input
                id="upload-file"
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                required
                className="text-xs cursor-pointer file:cursor-pointer file:text-xs file:font-semibold file:text-primary"
              />
              {file && (
                <div className="flex items-center justify-between p-2 rounded bg-surface-low border border-border text-[11px] font-mono">
                  <span className="truncate max-w-[280px] text-foreground">{file.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {(file.size / 1024).toFixed(1)} KB / 1024 KB
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload-notes">Catatan Mahasiswa / Poin Revisi (Opsional)</Label>
              <textarea
                id="upload-notes"
                rows={3}
                placeholder="Tuliskan catatan atau keterangan perbaikan jika ini merupakan pengumpulan revisi..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full rounded border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/70 bg-surface-low text-muted-foreground text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>
                Batas ukuran file dibatasi <strong>1 MB</strong> untuk menghemat kuota cloud storage. Format yang dianjurkan adalah PDF atau ZIP terkompresi.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !file}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Mengunggah Berkas...
                </>
              ) : (
                `Kirim Versi v${nextVersion}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
