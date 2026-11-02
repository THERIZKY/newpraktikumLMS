"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfileAction, changePasswordAction } from "@/server/actions/profile.actions";
import { toast } from "sonner";
import { User, Key, Save, Loader2 } from "lucide-react";

export function ProfileForm({
  user,
}: {
  user: {
    fullName: string;
    email?: string | null;
    phone?: string | null;
  };
}) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(user.fullName);
  const [email, setEmail] = React.useState(user.email || "");
  const [phone, setPhone] = React.useState(user.phone || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);

  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [isChangingPass, setIsChangingPass] = React.useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfileAction({ fullName, email, phone });
      toast.success("Profil Diperbarui", { description: "Informasi kontak Anda telah tersimpan." });
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal memperbarui profil");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass) {
      toast.error("Isi password lama dan password baru");
      return;
    }
    setIsChangingPass(true);
    try {
      await changePasswordAction({ oldPass, newPass });
      toast.success("Password Berhasil Diubah", { description: "Gunakan password baru pada login berikutnya." });
      setOldPass("");
      setNewPass("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mengubah password");
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Edit Profile */}
      <Card>
        <form onSubmit={handleProfileSubmit}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Informasi Data Diri
            </CardTitle>
            <CardDescription className="text-xs">
              Perbarui nama lengkap dan kontak informasi akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name">Nama Lengkap</Label>
              <Input
                id="prof-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-email">Alamat Email</Label>
              <Input
                id="prof-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-phone">Nomor Telepon / WhatsApp</Label>
              <Input
                id="prof-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-3 border-t border-border/50">
            <Button type="submit" size="sm" className="text-xs" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <form onSubmit={handlePasswordSubmit}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-neon-pink" />
              Ubah Kata Sandi
            </CardTitle>
            <CardDescription className="text-xs">
              Pastikan kata sandi baru Anda aman dan tidak mudah ditebak.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="prof-oldpass">Password Lama</Label>
              <Input
                id="prof-oldpass"
                type="password"
                placeholder="••••••••••••"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-newpass">Password Baru</Label>
              <Input
                id="prof-newpass"
                type="password"
                placeholder="Minimal 6 karakter..."
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="pt-3 border-t border-border/50">
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="text-xs border-neon-pink/40 hover:bg-neon-pink/10"
              disabled={isChangingPass}
            >
              {isChangingPass ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Memperbarui...
                </>
              ) : (
                "Perbarui Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
