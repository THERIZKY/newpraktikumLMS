"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClassAction } from "@/server/actions/session.actions";
import { toast } from "sonner";
import { Plus, Users, Loader2 } from "lucide-react";

export function CreateClassDialog({
  practicumId,
}: {
  practicumId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [scheduleDay, setScheduleDay] = React.useState("Senin");
  const [scheduleTime, setScheduleTime] = React.useState("08:00 - 10:30");
  const [room, setRoom] = React.useState("Lab Komputer Utama");
  const [maxStudents, setMaxStudents] = React.useState(40);
  const [autoGenerateSessions, setAutoGenerateSessions] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !scheduleDay || !scheduleTime) {
      toast.error("Harap isi nama kelas, hari, dan jam jadwal");
      return;
    }

    setIsLoading(true);
    try {
      await createClassAction({
        practicumId,
        name,
        scheduleDay,
        scheduleTime,
        room,
        maxStudents: Number(maxStudents) || 40,
        autoGenerateSessions,
      });

      toast.success("Kelas Berhasil Dibuka", {
        description: `Kelas ${name} telah dibuat beserta sesi pertemuannya.`,
      });
      setOpen(false);
      setName("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal membuat kelas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Buka Kelas / Shift Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Buka Kelas Praktikum Baru
            </DialogTitle>
            <DialogDescription>
              Tentukan nama shift, jadwal hari/jam, ruang lab, dan batas kuota mahasiswa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="class-name">Nama Kelas / Shift</Label>
              <Input
                id="class-name"
                placeholder="Contoh: Shift A - Senin Pagi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="schedule-day">Hari Praktikum</Label>
                <select
                  id="schedule-day"
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="schedule-time">Jam Pelaksanaan</Label>
                <Input
                  id="schedule-time"
                  placeholder="08:00 - 10:30"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="room-name">Ruang Laboratorium</Label>
                <Input
                  id="room-name"
                  placeholder="Lab RPL / Gedung E301"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-students">Kapasitas Maksimal (Mahasiswa)</Label>
                <Input
                  id="max-students"
                  type="number"
                  min="5"
                  max="100"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded border border-border/60 bg-muted/30 p-3">
              <input
                id="auto-sessions"
                type="checkbox"
                checked={autoGenerateSessions}
                onChange={(e) => setAutoGenerateSessions(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
              />
              <label htmlFor="auto-sessions" className="text-xs cursor-pointer">
                <span className="font-semibold block text-foreground">
                  Otomatis Buat Sesi 1 s.d. N Pertemuan
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Generate seluruh jadwal mingguan sesi sesuai total pertemuan praktikum.
                </span>
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
                  Membuka...
                </>
              ) : (
                "Buka Kelas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
