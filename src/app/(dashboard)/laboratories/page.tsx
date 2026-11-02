import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getLaboratories, getPotentialLabAdmins } from "@/server/queries/laboratory.queries";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateLabDialog } from "@/components/laboratories/create-lab-dialog";
import { AssignLabAdminDialog } from "@/components/laboratories/assign-lab-admin-dialog";
import { Building2, BookOpen, User, ArrowRight } from "lucide-react";

function LaboratoriesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Skeleton className="h-60 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    </div>
  );
}

async function LaboratoriesContent() {
  await connection();
  const session = await auth();
  const isSystemAdmin = session?.user?.role === "SYSTEM_ADMIN";
  const isLabAdmin = session?.user?.role === "LAB_ADMIN";
  const labs = await getLaboratories(isLabAdmin ? session.user.id : undefined);

  let potentialAdmins: { id: string; fullName: string; role: string }[] = [];
  if (isSystemAdmin) {
    potentialAdmins = await getPotentialLabAdmins();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {labs.length} Laboratorium {isLabAdmin ? "Ditugaskan" : "Terdaftar"}
        </span>
        {isSystemAdmin && <CreateLabDialog users={potentialAdmins} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {labs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-lg">
            <Building2 className="mx-auto h-8 w-8 mb-2 opacity-40 text-primary" />
            <p className="text-sm font-medium">
              {isLabAdmin
                ? "Belum ada laboratorium yang ditugaskan ke akun Anda."
                : "Belum ada laboratorium terdaftar."}
            </p>
            {isSystemAdmin && (
              <p className="text-xs mt-1">Klik tombol &ldquo;Buka Lab Baru&rdquo; untuk memulai.</p>
            )}
          </div>
        ) : (
          labs.map((lab) => (
            <Card
              key={lab.id}
              className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-semibold text-primary">
                    {lab.code}
                  </Badge>
                  <Badge variant={lab.isActive ? "present" : "secondary"} className="text-[10px]">
                    {lab.isActive ? "Operasional" : "Non-Aktif"}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-foreground mt-2">
                  {lab.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {lab.description || "Laboratorium riset dan kegiatan praktikum mahasiswa."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between gap-2 rounded bg-muted/40 p-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-muted-foreground uppercase block font-mono">
                        Kepala Laboratorium
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {lab.admin?.fullName || "Belum Ditugaskan"}
                      </span>
                    </div>
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

                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                    {lab.practicums.length} Praktikum Aktif
                  </span>
                  <span>•</span>
                  <span>{lab._count.announcements} Pengumuman</span>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border/50">
                <Button asChild variant="outline" size="sm" className="w-full text-xs justify-between">
                  <Link href={`/laboratories/${lab.id}`}>
                    <span>Lihat Detail & Praktikum</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function LaboratoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">
              DEPARTEMEN & FAKULTAS
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Manajemen Laboratorium
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar seluruh unit laboratorium, koordinator lab, serta praktikum aktif per semester.
          </p>
        </div>
      </div>

      <Suspense fallback={<LaboratoriesSkeleton />}>
        <LaboratoriesContent />
      </Suspense>
    </div>
  );
}
