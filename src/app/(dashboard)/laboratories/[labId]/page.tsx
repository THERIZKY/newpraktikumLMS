import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getLaboratoryById, getPotentialLabAdmins } from "@/server/queries/laboratory.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreatePracticumDialog } from "@/components/practicums/create-practicum-dialog";
import { AssignLabAdminDialog } from "@/components/laboratories/assign-lab-admin-dialog";
import {
  BookOpen,
  User,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

function LaboratoryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}

async function LaboratoryDetailContent({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  await connection();
  const { labId } = await params;
  const lab = await getLaboratoryById(labId);

  if (!lab) {
    notFound();
  }

  const session = await auth();
  const isSystemAdmin = session?.user?.role === "SYSTEM_ADMIN";
  if (session?.user?.role === "LAB_ADMIN" && lab.adminId !== session.user.id) {
    redirect("/laboratories");
  }
  const canManage =
    isSystemAdmin ||
    (session?.user?.role === "LAB_ADMIN" && lab.adminId === session.user.id);

  let potentialAdmins: { id: string; fullName: string; role: string }[] = [];
  if (isSystemAdmin) {
    potentialAdmins = await getPotentialLabAdmins();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                {lab.code}
              </Badge>
              <Badge variant={lab.isActive ? "present" : "secondary"} className="text-[10px]">
                {lab.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {lab.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {lab.description || "Tidak ada deskripsi tambahan untuk laboratorium ini."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded border border-border/80 bg-muted/40 p-3 text-xs min-w-[220px]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">
                    Admin / Kepala Lab
                  </span>
                </div>
                {isSystemAdmin && (
                  <AssignLabAdminDialog
                    labId={lab.id}
                    labName={lab.name}
                    labCode={lab.code}
                    currentAdminId={lab.admin?.id}
                    labDescription={lab.description}
                    potentialAdmins={potentialAdmins}
                  />
                )}
              </div>
              <span className="font-semibold text-foreground block">
                {lab.admin?.fullName || "Belum Ditugaskan"}
              </span>
              {lab.admin?.email && (
                <span className="text-[10px] text-muted-foreground block truncate">
                  {lab.admin.email}
                </span>
              )}
            </div>

            {canManage && <CreatePracticumDialog laboratoryId={lab.id} />}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Mata Praktikum yang Dikelola ({lab.practicums.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar praktikum aktif di {lab.name} beserta kelas dan sesi.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Praktikum</TableHead>
                <TableHead>Tahun / Semester</TableHead>
                <TableHead>Total Sesi</TableHead>
                <TableHead>Kelas Shift</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lab.practicums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada mata praktikum dibuka di laboratorium ini.
                  </TableCell>
                </TableRow>
              ) : (
                lab.practicums.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-semibold text-primary">
                      {p.code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {p.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.academicYear} • {p.semester}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.totalSessions} Pertemuan
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        {p.classes.length} Kelas
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline" className="text-xs h-7">
                        <Link href={`/practicums/${p.id}`}>
                          Buka Praktikum
                          <ArrowRight className="h-3 w-3 ml-1" />
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

export default function LaboratoryDetailPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/laboratories">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke Laboratorium
          </Link>
        </Button>
      </div>

      <Suspense fallback={<LaboratoryDetailSkeleton />}>
        <LaboratoryDetailContent params={params} />
      </Suspense>
    </div>
  );
}
