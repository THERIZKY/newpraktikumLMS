"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bulkImportStudentsAction } from "@/server/actions/user.actions";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2 } from "lucide-react";

export function BulkImportDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [inputText, setInputText] = React.useState(
    "21120120140010, Ahmad Fauzan, ahmad@kampus.ac.id, 08123456789\n21120120140011, Budi Santoso, budi@kampus.ac.id, 08123456780\n21120120140012, Citra Dewi, citra@kampus.ac.id, 08123456781"
  );
  const [isImporting, setIsImporting] = React.useState(false);

  const parsedStudents = inputText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        nim: parts[0] || "",
        fullName: parts[1] || "",
        email: parts[2] || undefined,
        phone: parts[3] || undefined,
      };
    })
    .filter((s) => s.nim && s.fullName);

  const handleImport = async () => {
    if (parsedStudents.length === 0) {
      toast.error("Tidak ada data mahasiswa valid untuk diimpor");
      return;
    }

    setIsImporting(true);
    try {
      const res = await bulkImportStudentsAction(parsedStudents);
      toast.success("Impor Massal Selesai", {
        description: `Berhasil menambahkan ${res.createdCount} mahasiswa baru (${res.skippedCount} dilewati).`,
      });
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mengimpor data");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-500" />
          Bulk Import Mahasiswa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Bulk Import Mahasiswa Praktikan
          </DialogTitle>
          <DialogDescription>
            Masukkan daftar mahasiswa format CSV (NIM, Nama Lengkap, Email, No HP) atau salin langsung dari Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="csv-input">Format Data (Baris per Mahasiswa: NIM, Nama, Email, HP)</Label>
            <textarea
              id="csv-input"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full rounded border border-border bg-background p-2.5 font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
              <span>Preview Terdeteksi ({parsedStudents.length} Mahasiswa)</span>
              <span>Password Default: password123</span>
            </div>

            <div className="rounded border border-border/70 max-h-40 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedStudents.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-[11px] font-semibold text-primary">
                        {s.nim}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{s.fullName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isImporting}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={isImporting || parsedStudents.length === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Mengimpor...
              </>
            ) : (
              `Impor ${parsedStudents.length} Mahasiswa`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
