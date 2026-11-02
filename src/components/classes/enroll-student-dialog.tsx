"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { enrollStudentAction } from "@/server/actions/session.actions";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

export function EnrollStudentDialog({
  practicumClassId,
  students,
}: {
  practicumClassId: string;
  students: { id: string; fullName: string; nim?: string | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [studentId, setStudentId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Pilih mahasiswa yang ingin didaftarkan");
      return;
    }

    setIsLoading(true);
    try {
      await enrollStudentAction({
        practicumClassId,
        studentId,
      });

      toast.success("Mahasiswa Berhasil Terdaftar", {
        description: "Praktikan telah dimasukkan ke dalam kelas shift ini.",
      });
      setOpen(false);
      setStudentId("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mendaftarkan mahasiswa");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <UserPlus className="h-3.5 w-3.5 mr-1 text-primary" />
          Enroll Praktikan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Daftarkan Praktikan ke Kelas
            </DialogTitle>
            <DialogDescription>
              Pilih mahasiswa untuk didaftarkan ke shift kelas ini. Kapasitas dicek otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="student-select">Pilih Mahasiswa</Label>
              <select
                id="student-select"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                required
              >
                <option value="">Pilih Mahasiswa...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} {s.nim ? `(${s.nim})` : ""}
                  </option>
                ))}
              </select>
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
                  Mendaftarkan...
                </>
              ) : (
                "Enroll Mahasiswa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
