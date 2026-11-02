"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGradingComponentAction } from "@/server/actions/practicum.actions";
import { toast } from "sonner";
import { Plus, Award, Loader2 } from "lucide-react";
import { AggregationMethod } from "@prisma/client";

export function GradingComponentDialog({
  practicumId,
}: {
  practicumId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [weightPercent, setWeightPercent] = React.useState(20);
  const [order, setOrder] = React.useState(1);
  const [isPerSession, setIsPerSession] = React.useState(false);
  const [aggregationMethod, setAggregationMethod] = React.useState<AggregationMethod>("AVERAGE");
  const maxScore = 100;
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || weightPercent <= 0) {
      toast.error("Nama komponen dan bobot wajib diisi valid");
      return;
    }

    setIsLoading(true);
    try {
      await saveGradingComponentAction({
        practicumId,
        name,
        weight: Number(weightPercent) / 100, // convert percentage to decimal (e.g. 20% -> 0.20)
        order: Number(order) || 1,
        isPerSession,
        aggregationMethod: isPerSession ? aggregationMethod : undefined,
        maxScore: Number(maxScore) || 100,
      });

      toast.success("Komponen Penilaian Disimpan", {
        description: `Komponen ${name} (${weightPercent}%) telah dikonfigurasi.`,
      });
      setOpen(false);
      setName("");
      setWeightPercent(20);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan komponen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Tambah Komponen Nilai
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Konfigurasi Komponen Penilaian
            </DialogTitle>
            <DialogDescription>
              Tentukan nama komponen, bobot persentase, dan metode agregasi nilai sesi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="comp-name">Nama Komponen</Label>
              <Input
                id="comp-name"
                placeholder="Contoh: Laporan Mingguan, Quiz, Responsi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="comp-weight">Bobot Nilai (%)</Label>
                <Input
                  id="comp-weight"
                  type="number"
                  min="1"
                  max="100"
                  value={weightPercent}
                  onChange={(e) => setWeightPercent(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comp-order">Urutan Tampilan</Label>
                <Input
                  id="comp-order"
                  type="number"
                  min="1"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 rounded border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is-per-session" className="font-semibold cursor-pointer">
                    Dinilai Per-Sesi Pertemuan?
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Aktifkan jika komponen ini diinput setiap minggu/sesi (seperti Laporan Praktikum).
                  </p>
                </div>
                <input
                  id="is-per-session"
                  type="checkbox"
                  checked={isPerSession}
                  onChange={(e) => setIsPerSession(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                />
              </div>

              {isPerSession && (
                <div className="space-y-1.5 pt-2 border-t border-border/40 mt-2">
                  <Label htmlFor="agg-method">Metode Agregasi Skor Seluruh Sesi</Label>
                  <select
                    id="agg-method"
                    value={aggregationMethod}
                    onChange={(e) => setAggregationMethod(e.target.value as AggregationMethod)}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs font-mono"
                  >
                    <option value="AVERAGE">AVERAGE — Rata-rata skor seluruh sesi</option>
                    <option value="SUM">SUM — Penjumlahan total skor sesi</option>
                    <option value="HIGHEST">HIGHEST — Ambil skor sesi tertinggi</option>
                    <option value="LATEST">LATEST — Ambil skor pertemuan terakhir</option>
                  </select>
                </div>
              )}
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
                "Simpan Komponen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
