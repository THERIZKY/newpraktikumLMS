import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemAdminDashboard } from "@/components/dashboard/system-admin-dashboard";
import { LabAdminDashboard } from "@/components/dashboard/lab-admin-dashboard";
import { AssistantDashboard } from "@/components/dashboard/assistant-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 lg:col-span-2 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { role, id } = session.user;

  return (
    <>
      {role === "SYSTEM_ADMIN" && <SystemAdminDashboard />}
      {role === "LAB_ADMIN" && <LabAdminDashboard userId={id} />}
      {role === "ASSISTANT" && <AssistantDashboard assistantId={id} />}
      {role === "STUDENT" && (
        <StudentDashboard
          studentId={id}
          fullName={session.user.fullName}
          nim={session.user.nim || session.user.username}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
