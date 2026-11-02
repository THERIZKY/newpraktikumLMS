"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLaboratoryAction } from "@/server/actions/laboratory.actions";
import { toast } from "sonner";
import { Plus, Building2, Loader2 } from "lucide-react";

export function CreateLabDialog({
  users,
}: {
  users?: { id: string; fullName: string; role: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [adminId, setAdminId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error("Nama dan Kode Lab wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      await createLaboratoryAction({
        name,
        code,
        description,
        adminId: adminId || undefined,
      });
      toast.success("Laboratorium Berhasil Dibuat", {
        description: `Laboratorium ${name} (${code}) telah terdaftar.`,
      });
      setOpen(false);
      setName("");
      setCode("");
      setDescription("");
      setAdminId("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal membuat laboratorium");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Buka Lab Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Buka Laboratorium Baru
            </DialogTitle>
            <DialogDescription>
              Daftarkan unit laboratorium resmi beserta penunjukan Kepala Lab (Lab Admin).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="lab-name">Nama Laboratorium</Label>
              <Input
                id="lab-name"
                placeholder="Contoh: Lab Rekayasa Perangkat Lunak"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-code">Kode Singkat Lab (Unik)</Label>
              <Input
                id="lab-code"
                placeholder="Contoh: LAB-RPL"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-desc">Deskripsi & Ruang Lab</Label>
              <Input
                id="lab-desc"
                placeholder="Gedung E Lantai 3, Kapasitas 45 PC"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {users && users.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="lab-admin">Kepala Laboratorium (Wajib Role LAB_ADMIN)</Label>
                <select
                  id="lab-admin"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs font-mono"
                >
                  <option value="">Pilih Kepala Lab (Opsional)...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} — [LAB_ADMIN]
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                "Simpan Laboratorium"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
