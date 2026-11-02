import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getUsers } from "@/server/queries/user.queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { BulkImportDialog } from "@/components/users/bulk-import-dialog";
import { formatDateTime } from "@/lib/utils";
import { UserRole } from "@prisma/client";

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36 rounded-md" />
        <Skeleton className="h-8 w-52 rounded-md" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

async function UsersContent({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string }>;
}) {
  await connection();
  const { role, search } = await searchParams;
  const session = await auth();

  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  const isSystemAdmin = true;

  const users = await getUsers(role, search);

  const getRoleBadgeVariant = (userRole: UserRole) => {
    switch (userRole) {
      case "SYSTEM_ADMIN":
        return "neonPink";
      case "LAB_ADMIN":
        return "default";
      case "ASSISTANT":
        return "neonCyan";
      case "STUDENT":
        return "present";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {users.length} Akun Terdaftar
        </span>

        {isSystemAdmin && (
          <div className="flex items-center gap-2">
            <BulkImportDialog />
            <CreateUserDialog />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>NIM / Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Kontak Email / HP</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada akun pengguna ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, idx) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-primary">
                      {u.nim || u.username}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-foreground">
                      {u.fullName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(u.role)} className="text-[10px] font-mono">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{u.email || "-"}</div>
                      {u.phone && <div className="text-[10px] font-mono">{u.phone}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {formatDateTime(u.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={u.isActive ? "present" : "absent"} className="text-[10px]">
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
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

export default function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">
              MANAJEMEN PENGGUNA TERPADU
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Kelola Akun Pengguna
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen praktikan, asisten laboratorium, admin lab, dan hak akses sistem.
          </p>
        </div>
      </div>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
