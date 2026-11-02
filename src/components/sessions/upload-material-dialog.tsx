"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadSessionMaterialAction } from "@/server/actions/session.actions";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";

export function UploadMaterialDialog({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [fileSizeMb, setFileSizeMb] = React.useState("2.5");
  const [mimeType, setMimeType] = React.useState("application/pdf");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileName) {
      toast.error("Harap isi judul dan nama file");
      return;
    }

    setIsLoading(true);
    try {
      await uploadSessionMaterialAction({
        sessionId,
        title,
        fileName,
        filePath: `materials/${sessionId}/${fileName}`,
        fileSize: Math.round(Number(fileSizeMb) * 1024 * 1024) || 2048576,
        mimeType,
      });

      toast.success("Materi Berhasil Diunggah", {
        description: `Modul ${title} telah dilampirkan ke sesi pertemuan.`,
      });
      setOpen(false);
      setTitle("");
      setFileName("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mengunggah materi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <Upload className="h-3.5 w-3.5 mr-1" />
          Unggah Modul / Materi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Unggah Modul Sesi Pertemuan
            </DialogTitle>
            <DialogDescription>
              Lampirkan materi pedoman praktikum, slide presentasi, atau starter code (.pdf, .zip).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="mat-title">Judul Materi / Modul</Label>
              <Input
                id="mat-title"
                placeholder="Contoh: Modul 03: Arsitektur MVC & Routing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mat-filename">Nama File</Label>
              <Input
                id="mat-filename"
                placeholder="Contoh: Modul_03_MVC.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mat-mimetype">Tipe Dokumen</Label>
                <select
                  id="mat-mimetype"
                  value={mimeType}
                  onChange={(e) => setMimeType(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs font-mono"
                >
                  <option value="application/pdf">PDF Document (.pdf)</option>
                  <option value="application/zip">ZIP Archive (.zip)</option>
                  <option value="application/x-ipynb+json">Jupyter Notebook (.ipynb)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mat-size">Perkiraan Ukuran (MB)</Label>
                <Input
                  id="mat-size"
                  type="number"
                  step="0.1"
                  value={fileSizeMb}
                  onChange={(e) => setFileSizeMb(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                "Simpan Materi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
