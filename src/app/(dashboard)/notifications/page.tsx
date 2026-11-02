import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getUserNotifications } from "@/server/queries/notification.queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Clock, Award, FileCheck2, Megaphone, Terminal } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { markAllNotificationsAsReadAction } from "@/server/actions/notification.actions";

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-8 w-44 rounded-md" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

async function NotificationsContent() {
  await connection();
  const session = await auth();

  const notifications = session?.user?.id
    ? await getUserNotifications(session.user.id)
    : [];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "GRADE":
        return <Award className="h-4 w-4 text-emerald-400" />;
      case "SUBMISSION":
        return <FileCheck2 className="h-4 w-4 text-neon-cyan" />;
      case "DEADLINE":
        return <Clock className="h-4 w-4 text-amber-400" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-4 w-4 text-primary" />;
      default:
        return <Terminal className="h-4 w-4 text-neon-pink" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {unreadCount} Belum Dibaca
        </span>
        {unreadCount > 0 && (
          <form
            action={async () => {
              "use server";
              await markAllNotificationsAsReadAction();
            }}
          >
            <Button size="sm" variant="outline" className="text-xs">
              <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              Tandai Semua Sudah Dibaca
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed rounded-lg">
            <Bell className="mx-auto h-8 w-8 mb-2 opacity-40 text-primary" />
            <p className="text-sm font-medium">Kotak notifikasi Anda bersih.</p>
            <p className="text-xs mt-1">Tidak ada pemberitahuan baru saat ini.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 transition-colors ${
                !notif.isRead ? "border-primary/40 bg-primary/5" : "bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-muted/60 shrink-0 mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">
              INBOX PEMBERITAHUAN
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Pusat Notifikasi Akun
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pemberitahuan perubahan status tugas, pengumuman modul baru, dan rilis nilai akhir.
          </p>
        </div>
      </div>

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent />
      </Suspense>
    </div>
  );
}
