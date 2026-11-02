"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignAssistantAction } from "@/server/actions/session.actions";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export function AssignAssistantDialog({
  practicumClassId,
  assistants,
}: {
  practicumClassId: string;
  assistants: { id: string; fullName: string; nim?: string | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [assistantId, setAssistantId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantId) {
      toast.error("Pilih asisten yang ingin ditugaskan");
      return;
    }

    setIsLoading(true);
    try {
      await assignAssistantAction({
        practicumClassId,
        assistantId,
      });

      toast.success("Asisten Berhasil Ditugaskan", {
        description: "Asisten kini memiliki hak presensi & penilaian kelas ini.",
      });
      setOpen(false);
      setAssistantId("");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menugaskan asisten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-neon-cyan" />
          Assign Asisten
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-neon-cyan" />
              Tugaskan Asisten Praktikum
            </DialogTitle>
            <DialogDescription>
              Tugaskan asisten (Asprak) untuk mengampu sesi praktikum & input nilai kelas ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="assistant-select">Pilih Asisten</Label>
              <select
                id="assistant-select"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                required
              >
                <option value="">Pilih Asisten...</option>
                {assistants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} {a.nim ? `(${a.nim})` : ""}
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
                  Menugaskan...
                </>
              ) : (
                "Tugaskan Asisten"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
