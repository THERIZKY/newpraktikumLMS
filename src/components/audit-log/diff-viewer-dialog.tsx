"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

export function DiffViewerDialog({
  action,
  entityType,
  oldValues,
  newValues,
}: {
  action: string;
  entityType: string;
  oldValues?: unknown;
  newValues?: unknown;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs h-7">
          <Code2 className="h-3 w-3 mr-1 text-primary" />
          Lihat Diff JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">
              AUDIT MUTASI DATA
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {action}
            </Badge>
          </div>
          <DialogTitle className="text-sm font-bold">
            Inspeksi Nilai Entitas: {entityType}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Perbandingan payload sebelum dan sesudah mutasi terekam di sistem.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Nilai Lama (Old Values)
            </span>
            <div className="rounded border border-border/80 bg-muted/40 p-3 max-h-60 overflow-auto text-[11px] text-rose-400">
              {oldValues ? (
                <pre>{JSON.stringify(oldValues, null, 2)}</pre>
              ) : (
                <span className="text-muted-foreground italic">Tidak ada payload lama (Entitas Baru)</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Nilai Baru (New Values)
            </span>
            <div className="rounded border border-border/80 bg-muted/40 p-3 max-h-60 overflow-auto text-[11px] text-emerald-400">
              {newValues ? (
                <pre>{JSON.stringify(newValues, null, 2)}</pre>
              ) : (
                <span className="text-muted-foreground italic">Payload baru kosong (Entitas Dihapus)</span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
