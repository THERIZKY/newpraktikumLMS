"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPracticumAction } from "@/server/actions/practicum.actions";
import { toast } from "sonner";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { Semester } from "@prisma/client";

export function CreatePracticumDialog({
  laboratoryId,
  laboratories,
}: {
  laboratoryId?: string;
  laboratories?: { id: string; name: string; code: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedLabId, setSelectedLabId] = React.useState(laboratoryId || "");
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("2026/2027");
  const [semester, setSemester] = React.useState<Semester>("ODD");
  const [totalSessions, setTotalSessions] = React.useState(10);
  const [description, setDescription] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const labIdToUse = laboratoryId || selectedLabId;
    if (!labIdToUse || !name || !code) {
      toast.error("Harap lengkapi semua field wajib");
      return;
    }

    setIsLoading(true);
    try {
      await createPracticumAction({
        laboratoryId: labIdToUse,
        name,
        code,
        academicYear,
        semester,
        totalSessions: Number(totalSessions) || 10,
        description,
      });

      toast.success("Praktikum Berhasil Dibuka", {
        description: `Mata Praktikum ${name} (${code}) siap dikonfigurasi.`,
      });
      setOpen(false);
      setName("");
      setCode("");
      setDescription("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal membuat praktikum");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Buka Praktikum Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Buka Mata Praktikum Baru
            </DialogTitle>
            <DialogDescription>
              Membuka mata praktikum pada semester aktif dan otomatis menyiapkan skema nilai standar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            {!laboratoryId && laboratories && laboratories.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="lab-select">Pilih Laboratorium Naungan</Label>
                <select
                  id="lab-select"
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                  required
                >
                  <option value="">Pilih Lab...</option>
                  {laboratories.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} — {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="practicum-name">Nama Mata Praktikum</Label>
              <Input
                id="practicum-name"
                placeholder="Contoh: Praktikum Algoritma & Pemrograman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="practicum-code">Kode Mata Praktikum</Label>
                <Input
                  id="practicum-code"
                  placeholder="Contoh: PRAK-ALPRO"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="practicum-sessions">Total Pertemuan (Sesi)</Label>
                <Input
                  id="practicum-sessions"
                  type="number"
                  min="1"
                  max="16"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="academic-year">Tahun Akademik</Label>
                <Input
                  id="academic-year"
                  placeholder="2026/2027"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="semester-select">Semester</Label>
                <select
                  id="semester-select"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as Semester)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="ODD">Ganjil (Odd)</option>
                  <option value="EVEN">Genap (Even)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="practicum-desc">Deskripsi & Prasyarat</Label>
              <Input
                id="practicum-desc"
                placeholder="Materi C++, Struktur Data, dan Algoritma Pencarian"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
                  Membuka...
                </>
              ) : (
                "Buka Praktikum"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
