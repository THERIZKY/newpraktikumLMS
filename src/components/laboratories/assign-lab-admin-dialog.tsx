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
import { Badge } from "@/components/ui/badge";
import { updateLaboratoryAction } from "@/server/actions/laboratory.actions";
import { toast } from "sonner";
import { UserCheck, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export function AssignLabAdminDialog({
  labId,
  labName,
  labCode,
  currentAdminId,
  labDescription,
  potentialAdmins,
}: {
  labId: string;
  labName: string;
  labCode: string;
  currentAdminId?: string | null;
  labDescription?: string | null;
  potentialAdmins: { id: string; fullName: string; role: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedAdminId, setSelectedAdminId] = React.useState(currentAdminId || "");
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setSelectedAdminId(currentAdminId || "");
  }, [currentAdminId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateLaboratoryAction({
        labId,
        name: labName,
        code: labCode,
        description: labDescription || undefined,
        adminId: selectedAdminId || undefined,
      });

      const assignedUser = potentialAdmins.find((u) => u.id === selectedAdminId);

      toast.success("Penugasan Kepala Laboratorium Berhasil", {
        description: assignedUser
          ? `${assignedUser.fullName} telah ditugaskan sebagai Kepala ${labName}.`
          : `Kepala Laboratorium ${labName} telah dikosongkan.`,
      });

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal memperbarui kepala laboratorium");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 px-2 border-primary/40 hover:border-primary text-foreground hover:bg-primary/5"
          title="Atur Kepala Laboratorium"
        >
          <UserCheck className="h-3.5 w-3.5 mr-1 text-primary" />
          Assign Kepala Lab
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-[10px]">
                {labCode}
              </Badge>
              <Badge variant="neonCyan" className="font-mono text-[10px]">
                ROLE: LAB_ADMIN ONLY
              </Badge>
            </div>
            <DialogTitle className="flex items-center gap-2 text-base font-bold font-sans">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Penugasan Kepala Laboratorium
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih pengguna dengan role <strong className="text-foreground">LAB_ADMIN</strong> untuk mengelola praktikum, modul, dan pengumuman di <strong>{labName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="assign-admin-select">Pilih Kepala Laboratorium</Label>
              {potentialAdmins.length === 0 ? (
                <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs">
                  Tidak ditemukan user dengan role <strong>LAB_ADMIN</strong> yang aktif. Buat atau ubah role pengguna terlebih dahulu di menu <em>Kelola Pengguna</em>.
                </div>
              ) : (
                <select
                  id="assign-admin-select"
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs font-mono"
                >
                  <option value="">-- Kosongkan / Belum Ditugaskan --</option>
                  {potentialAdmins.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (LAB_ADMIN)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border/70 bg-surface-low text-muted-foreground text-[11px]">
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Seorang <strong>LAB_ADMIN</strong> dapat ditugaskan untuk mengelola lebih dari satu laboratorium (misalnya merangkap kepala lab RPL dan Jarkom).
              </span>
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
                  Menyimpan...
                </>
              ) : (
                "Simpan Penugasan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
