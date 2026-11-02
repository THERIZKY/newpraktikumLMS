import Link from "next/link";
import { getSystemAdminStats } from "@/server/queries/dashboard.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Building2,
  BookOpen,
  History,
  Shield,
  ArrowUpRight,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export async function SystemAdminDashboard() {
  const stats = await getSystemAdminStats();

  return (
    <div className="space-y-6">
      {/* Top Banner with Neon Accent */}
      <div className="relative overflow-hidden rounded-lg border border-neon-pink/30 bg-card p-6 shadow-sm neon-border-pink">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="neonPink" className="text-[10px]">
                ROOT SYSTEM PRIVILEGES
              </Badge>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-neon-yellow" />
                Cluster Node: Online
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans">
              System Admin Console
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pemantauan performa instansi, seluruh laboratorium, manajemen akun & jejak audit sistem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/users">
                <Users className="h-3.5 w-3.5 mr-1 text-primary" />
                Kelola Pengguna
              </Link>
            </Button>
            <Button asChild size="sm" className="text-xs">
              <Link href="/laboratories">
                <Building2 className="h-3.5 w-3.5 mr-1" />
                Buka Laboratorium
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Total Pengguna
            </CardTitle>
            <div className="p-2 rounded bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers text-foreground">
              {stats.totalUsers}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">{stats.roleCounts.STUDENT}</span> Praktikan •{" "}
              <span className="text-sky-400 font-semibold">{stats.roleCounts.ASSISTANT}</span> Asprak
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Laboratorium Aktif
            </CardTitle>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers text-foreground">
              {stats.totalLabs}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Terdaftar di Departemen & Fakultas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-neon-cyan/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Praktikum Berjalan
            </CardTitle>
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers text-foreground">
              {stats.totalPracticums}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Semester Aktif 2026/2027
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-neon-pink/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Integritas Sistem
            </CardTitle>
            <div className="p-2 rounded bg-neon-pink/10 text-neon-pink">
              <Shield className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers text-foreground flex items-center gap-1.5">
              100%
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Auth.js v5 • PostgreSQL Adapter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Audit Logs and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log Feed (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-neon-cyan" />
                Live Audit Log Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Catatan mutasi database dan aktivitas pengguna secara transparan.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/audit-log">
                Lihat Semua
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entitas</TableHead>
                  <TableHead>Pelaku</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentAuditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Belum ada audit log terekam.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">
                        {log.entityType}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-foreground">
                          {log.user?.fullName || "System Engine"}
                        </span>
                        {log.user?.role && (
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            {log.user.role}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Global Announcements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-400" />
              Pengumuman Terbaru
            </CardTitle>
            <CardDescription className="text-xs">
              Siaran informasi terpusat laboratorium.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentAnnouncements.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Belum ada pengumuman disiarkan.
              </p>
            ) : (
              stats.recentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="rounded border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-medium text-primary">
                      {ann.priority}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateTime(ann.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">{ann.title}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {ann.content}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
