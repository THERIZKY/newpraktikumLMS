import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StudentNavbar } from "@/components/layout/student-navbar";
import { Skeleton } from "@/components/ui/skeleton";

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-card/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-44 rounded-md hidden sm:block" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </header>
  );
}

async function AsyncSidebar() {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // Praktikan (STUDENT) uses full-width top navbar layout without left sidebar
  if (session.user.role === "STUDENT") {
    return null;
  }
  return <AppSidebar user={session.user} />;
}

async function AsyncHeader() {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "STUDENT") {
    return <StudentNavbar user={session.user} />;
  }
  return <DashboardHeader user={session.user} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Suspense fallback={null}>
        <AsyncSidebar />
      </Suspense>
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Suspense fallback={<HeaderFallback />}>
          <AsyncHeader />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
        <footer className="w-full border-t border-primary/20 bg-background/80 py-4 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_#ff2d78]" />
              <span>
                Sistem Praktikum Akademik Terpadu v2.4 //{" "}
                <span className="text-secondary font-semibold">NEON TOKYO</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_6px_#00f0ff] animate-pulse" />
                RT Sync Active
              </span>
            </div>
          </div>
        </footer>
      </div>
    </SidebarProvider>
  );
}

