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
import {
  saveGradingComponentAction,
  deleteGradingComponentAction,
} from "@/server/actions/practicum.actions";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Loader2,
  Award,
  AlertCircle,
} from "lucide-react";
import { AggregationMethod } from "@prisma/client";

export interface GradingComponentItem {
  id: string;
  name: string;
  weight: number | string | any;
  order: number;
  isPerSession: boolean;
  aggregationMethod: AggregationMethod | null;
  maxScore: number | string | any;
}

export function ManageGradingComponentsDialog({
  practicumId,
  practicumName,
  components: initialComponents,
}: {
  practicumId: string;
  practicumName: string;
  components: GradingComponentItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Form state for adding new component
  const [name, setName] = React.useState("");
  const [weightPercent, setWeightPercent] = React.useState<number>(20);
  const [isPerSession, setIsPerSession] = React.useState(false);
  const [aggregationMethod, setAggregationMethod] =
    React.useState<AggregationMethod>("AVERAGE");

  // Calculate current total weight
  const totalWeightPercent = initialComponents.reduce(
    (acc, c) => acc + Math.round(Number(c.weight) * 100),
    0
  );

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama komponen penilaian tidak boleh kosong.");
      return;
    }
    if (weightPercent <= 0 || weightPercent > 100) {
      toast.error("Bobot nilai harus antara 1% - 100%.");
      return;
    }

    setIsLoading(true);
    try {
      await saveGradingComponentAction({
        practicumId,
        name: name.trim(),
        weight: Number(weightPercent) / 100,
        order: initialComponents.length + 1,
        isPerSession,
        aggregationMethod: isPerSession ? aggregationMethod : undefined,
        maxScore: 100,
      });

      toast.success("Komponen Penilaian Ditambahkan", {
        description: `${name} (${weightPercent}%) berhasil disimpan ke skema penilaian.`,
      });

      setName("");
      setWeightPercent(20);
      setIsPerSession(false);
      setIsAdding(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menambahkan komponen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (comp: GradingComponentItem) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus komponen "${comp.name}"? Data nilai mahasiswa terkait komponen ini dapat terpengaruh.`
    );
    if (!confirmDelete) return;

    setDeletingId(comp.id);
    try {
      await deleteGradingComponentAction(comp.id, practicumId);
      toast.success("Komponen Penilaian Dihapus", {
        description: `Komponen ${comp.name} berhasil dihapus dari skema.`,
      });
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menghapus komponen");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8 px-2.5 border-primary/40 hover:border-primary text-foreground"
          title="Kelola Komponen Penilaian"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-primary" />
          Komponen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              SKEMA PENILAIAN PRAKTIKUM
            </Badge>
            <Badge
              variant={totalWeightPercent === 100 ? "present" : "late"}
              className="font-mono text-[10px]"
            >
              Total Bobot: {totalWeightPercent}%
            </Badge>
          </div>
          <DialogTitle className="flex items-center gap-2 text-base font-bold font-sans">
            <Award className="h-4 w-4 text-primary" />
            Kelola Komponen Penilaian: {practicumName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tambah, perbarui, atau hapus komponen penilaian (misal: Laporan, Tugas, Keaktifan, Responsi) untuk praktikum ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* List of existing components */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px] px-1">
              <span>Daftar Komponen Terpasang ({initialComponents.length})</span>
              <span>Bobot / Agregasi</span>
            </div>

            {initialComponents.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-dashed border-border text-muted-foreground text-xs">
                Belum ada komponen penilaian untuk mata praktikum ini.
              </div>
            ) : (
              <div className="space-y-2">
                {initialComponents.map((comp) => {
                  const weightPct = Math.round(Number(comp.weight) * 100);
                  const isDeleting = deletingId === comp.id;

                  return (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/70 bg-card hover:border-border transition-all"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs">
                            {comp.name}
                          </span>
                          <Badge variant="neonCyan" className="text-[10px] font-mono">
                            {weightPct}%
                          </Badge>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {comp.isPerSession
                            ? `Dinilai Per-Sesi (${comp.aggregationMethod || "AVERAGE"})`
                            : "Evaluasi Akhir Praktikum"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(comp)}
                          disabled={isDeleting}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          title="Hapus Komponen"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form to add new component */}
          {isAdding ? (
            <form
              onSubmit={handleCreateComponent}
              className="space-y-3 rounded-xl border border-primary/40 bg-surface-low p-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="font-semibold text-foreground font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Tambah Komponen Baru
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-muted-foreground"
                  onClick={() => setIsAdding(false)}
                >
                  Tutup
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-comp-name">Nama Komponen</Label>
                <Input
                  id="new-comp-name"
                  placeholder="Misal: Keaktifan, Ketertiban, Tugas Pendahuluan, Responsi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs bg-background"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-comp-weight">Bobot Nilai (%)</Label>
                  <Input
                    id="new-comp-weight"
                    type="number"
                    min="1"
                    max="100"
                    value={weightPercent}
                    onChange={(e) => setWeightPercent(Number(e.target.value))}
                    className="h-8 text-xs bg-background font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-comp-persession">Metode Penilaian</Label>
                  <select
                    id="new-comp-persession"
                    value={isPerSession ? "YES" : "NO"}
                    onChange={(e) => setIsPerSession(e.target.value === "YES")}
                    className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono"
                  >
                    <option value="NO">Evaluasi Akhir (Sekali)</option>
                    <option value="YES">Per-Sesi Pertemuan</option>
                  </select>
                </div>
              </div>

              {isPerSession && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label htmlFor="new-agg-method">Agregasi Skor Per-Sesi</Label>
                  <select
                    id="new-agg-method"
                    value={aggregationMethod}
                    onChange={(e) =>
                      setAggregationMethod(e.target.value as AggregationMethod)
                    }
                    className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono"
                  >
                    <option value="AVERAGE">AVERAGE — Rata-rata skor semua sesi</option>
                    <option value="SUM">SUM — Penjumlahan total skor sesi</option>
                    <option value="HIGHEST">HIGHEST — Ambil nilai sesi tertinggi</option>
                    <option value="LATEST">LATEST — Ambil nilai sesi terakhir</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setIsAdding(false)}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs bg-primary text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Komponen"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full text-xs h-9 border-dashed border-primary/40 hover:border-primary text-primary hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Tambah Komponen Penilaian Baru
            </Button>
          )}

          {totalWeightPercent !== 100 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Total bobot saat ini adalah <strong>{totalWeightPercent}%</strong>. Idealnya total seluruh komponen bernilai <strong>100%</strong> agar kalkulasi nilai akhir presisi.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
