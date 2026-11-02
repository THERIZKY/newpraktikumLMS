"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserAction } from "@/server/actions/user.actions";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { UserRole } from "@prisma/client";

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [nim, setNim] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("STUDENT");
  const [password, setPassword] = React.useState("password123");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName) {
      toast.error("Username dan Nama Lengkap wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      await createUserAction({
        username,
        fullName,
        nim: nim || undefined,
        email: email || undefined,
        phone: phone || undefined,
        role,
        password,
      });

      toast.success("Pengguna Berhasil Ditambahkan", {
        description: `Akun ${fullName} (${role}) telah aktif.`,
      });
      setOpen(false);
      setUsername("");
      setFullName("");
      setNim("");
      setEmail("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal membuat pengguna");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Tambah Pengguna
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Tambah Akun Pengguna Baru
            </DialogTitle>
            <DialogDescription>
              Buat akun dengan hak akses System Admin, Lab Admin, Asisten, atau Praktikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="user-role">Role / Peran Sistem</Label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs font-mono"
                >
                  <option value="STUDENT">STUDENT (Praktikan)</option>
                  <option value="ASSISTANT">ASSISTANT (Asprak)</option>
                  <option value="LAB_ADMIN">LAB_ADMIN (Kepala Lab)</option>
                  <option value="SYSTEM_ADMIN">SYSTEM_ADMIN (Super Admin)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-username">Username Login</Label>
                <Input
                  id="user-username"
                  placeholder="Contoh: ahmad.f"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-name">Nama Lengkap</Label>
              <Input
                id="user-name"
                placeholder="Contoh: Ahmad Fauzan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="user-nim">NIM (Nomor Induk Mahasiswa)</Label>
                <Input
                  id="user-nim"
                  placeholder="21120120140001"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-phone">Nomor Telepon / WhatsApp</Label>
                <Input
                  id="user-phone"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-email">Alamat Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="ahmad@kampus.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-pass">Password Sementara</Label>
              <Input
                id="user-pass"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-mono text-xs"
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
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengguna"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
