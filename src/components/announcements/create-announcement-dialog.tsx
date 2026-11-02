"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAnnouncementAction } from "@/server/actions/announcement.actions";
import { toast } from "sonner";
import { Megaphone, Plus, Loader2 } from "lucide-react";
import { AnnouncementPriority } from "@prisma/client";

export function CreateAnnouncementDialog({
  laboratories,
}: {
  laboratories?: { id: string; name: string; code: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [priority, setPriority] = React.useState<AnnouncementPriority>("NORMAL");
  const [laboratoryId, setLaboratoryId] = React.useState("");
  const [isPinned, setIsPinned] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Judul dan isi pengumuman wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      await createAnnouncementAction({
        title,
        content,
        priority,
        laboratoryId: laboratoryId || undefined,
        isPinned,
      });

      toast.success("Pengumuman Berhasil Disiarkan", {
        description: "Pengumuman telah dipublikasikan ke seluruh praktikan & asisten.",
      });
      setOpen(false);
      setTitle("");
      setContent("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyiarkan pengumuman");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Buat Siaran Pengumuman
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Siarkan Pengumuman Laboratorium
            </DialogTitle>
            <DialogDescription>
              Kirimkan pengumuman penting, jadwal responsi, atau pengumuman keterlambatan tugas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Judul Pengumuman</Label>
              <Input
                id="ann-title"
                placeholder="Contoh: Jadwal Responsi Akhir Praktikum Semester Genap"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ann-priority">Prioritas</Label>
                <select
                  id="ann-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="LOW">LOW — Informasi Santai</option>
                  <option value="NORMAL">NORMAL — Standar</option>
                  <option value="HIGH">HIGH — Penting</option>
                  <option value="URGENT">URGENT — Sangat Penting / Mendesak</option>
                </select>
              </div>

              {laboratories && (
                <div className="space-y-1.5">
                  <Label htmlFor="ann-lab">Terkait Laboratorium</Label>
                  <select
                    id="ann-lab"
                    value={laboratoryId}
                    onChange={(e) => setLaboratoryId(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                  >
                    <option value="">Semua Laboratorium (Global)</option>
                    {laboratories.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-content">Isi Pengumuman</Label>
              <textarea
                id="ann-content"
                rows={5}
                placeholder="Tuliskan detail pengumuman secara lengkap di sini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full rounded border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 rounded border border-border/60 bg-muted/30 p-2.5">
              <input
                id="ann-pinned"
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
              />
              <label htmlFor="ann-pinned" className="text-xs cursor-pointer">
                Sematkan di bagian teratas (Pin to Top)
              </label>
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
                  Menyiarkan...
                </>
              ) : (
                "Publikasikan Siaran"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
