import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getUserProfile } from "@/server/queries/user.queries";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "@/components/profile/profile-form";
import { formatDateTime } from "@/lib/utils";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}

async function ProfileContent() {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await getUserProfile(session.user.id);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary text-xl font-bold font-mono">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                  {user.role}
                </Badge>
                {user.nim && (
                  <span className="font-mono text-xs text-muted-foreground">
                    NIM: {user.nim}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
                {user.fullName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                @{user.username} • Login Terakhir: {formatDateTime(user.lastLoginAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={user.isActive ? "present" : "absent"}>
              {user.isActive ? "Akun Aktif" : "Akun Ditangguhkan"}
            </Badge>
          </div>
        </div>
      </div>

      <ProfileForm
        user={{
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-4">
        <Badge variant="outline" className="text-[10px] mb-1 font-mono">
          PROFIL & KEAMANAN AKUN
        </Badge>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
          Profil Pengguna & Kredensial
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola informasi pribadi, kontak akademik, dan kata sandi akun Anda.
        </p>
      </div>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
