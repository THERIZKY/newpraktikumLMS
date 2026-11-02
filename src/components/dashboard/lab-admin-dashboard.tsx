import Link from "next/link";
import { getLabAdminStats } from "@/server/queries/dashboard.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2,
  BookOpen,
  Users,
  FileCheck2,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";

export async function LabAdminDashboard({ userId }: { userId: string }) {
  const stats = await getLabAdminStats(userId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-card p-6 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px]">
                LABORATORY CHIEF ADMINISTRATOR
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Kelola Kurikulum & Asisten
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans">
              Lab Admin Workspace
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola mata praktikum, skema penilaian, kelas shift, serta publikasi nilai akhir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="text-xs">
              <Link href="/practicums">
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Buka Praktikum Baru
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Lab Dikelola
            </CardTitle>
            <div className="p-2 rounded bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers">
              {stats.managedLabs.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Laboratorium Resmi
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Mata Praktikum
            </CardTitle>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers">
              {stats.totalPracticums}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Semester Berjalan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Kelas & Mahasiswa
            </CardTitle>
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers">
              {stats.totalStudents}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Terdaftar di {stats.totalClasses} Kelas Shift
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">
              Antrean Review Tugas
            </CardTitle>
            <div className="p-2 rounded bg-amber-500/10 text-amber-500">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-numbers text-amber-500">
              {stats.pendingReviewsCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Menunggu Review Asisten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Managed Laboratories Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Laboratorium yang Anda Kelola
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar lab, mata praktikum aktif, dan kuota mahasiswa.
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/laboratories">
              Semua Laboratorium
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Lab</TableHead>
                <TableHead>Nama Laboratorium</TableHead>
                <TableHead>Praktikum Aktif</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.managedLabs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Anda belum ditugaskan sebagai Lab Admin pada laboratorium manapun.
                  </TableCell>
                </TableRow>
              ) : (
                stats.managedLabs.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-mono font-semibold text-primary">
                      {lab.code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {lab.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {lab.practicums.length} Praktikum
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline" className="text-xs h-7">
                        <Link href={`/laboratories/${lab.id}`}>
                          Detail Lab
                        </Link>
                      </Button>
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
