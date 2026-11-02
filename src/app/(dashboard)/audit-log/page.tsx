import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getAuditLogs } from "@/server/queries/admin.queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DiffViewerDialog } from "@/components/audit-log/diff-viewer-dialog";
import { History } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

function AuditLogSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40 rounded-md" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

async function AuditLogContent() {
  await connection();
  const session = await auth();

  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  const logs = await getAuditLogs();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground font-mono">
          {logs.length} Jejak Mutasi Terbaru
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Waktu Transaksi</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Tipe Entitas</TableHead>
                <TableHead>Pelaku Eksekusi</TableHead>
                <TableHead className="text-right">Inspeksi Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <History className="mx-auto h-7 w-7 mb-2 opacity-40 text-primary" />
                    <p className="text-xs font-medium">Belum ada jejak audit log terekam.</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] font-bold">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {log.entityType}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-medium text-foreground">
                        {log.user?.fullName || "System Service"}
                      </span>
                      {log.user?.role && (
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {log.user.role}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DiffViewerDialog
                        action={log.action}
                        entityType={log.entityType}
                        oldValues={log.oldValues}
                        newValues={log.newValues}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="neonPink" className="text-[10px] font-mono">
            SECURITY & COMPLIANCE
          </Badge>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
          Audit Log & Jejak Mutasi Sistem
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rekaman jejak aktivitas database, pembuatan laboratorium, modifikasi skema nilai, dan impor pengguna.
        </p>
      </div>

      <Suspense fallback={<AuditLogSkeleton />}>
        <AuditLogContent />
      </Suspense>
    </div>
  );
}
