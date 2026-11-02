import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getAnnouncements, getActiveLaboratories } from "@/server/queries/announcement.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAnnouncementDialog } from "@/components/announcements/create-announcement-dialog";
import { Megaphone, Pin, Calendar, Building2, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-36 w-full rounded-lg" />
    </div>
  );
}

async function AnnouncementsContent() {
  await connection();
  const session = await auth();
  const isLabAdmin = session?.user?.role === "LAB_ADMIN";
  const canPublish = ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(
    session?.user?.role || ""
  );

  const [announcements, laboratories] = await Promise.all([
    getAnnouncements(),
    canPublish
      ? getActiveLaboratories(isLabAdmin ? session.user.id : undefined)
      : [],
  ]);

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "absent";
      case "HIGH":
        return "late";
      case "NORMAL":
        return "default";
      case "LOW":
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {announcements.length} Siaran Aktif
        </span>
        {canPublish && <CreateAnnouncementDialog laboratories={laboratories} />}
      </div>

      {announcements.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed rounded-lg">
          <Megaphone className="mx-auto h-8 w-8 mb-2 opacity-40 text-primary" />
          <p className="text-sm font-medium">Belum ada pengumuman disiarkan.</p>
        </div>
      ) : (
        announcements.map((ann) => (
          <Card
            key={ann.id}
            className={`transition-all hover:border-primary/40 ${
              ann.isPinned ? "border-amber-500/40 bg-amber-500/5 shadow-xs" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {ann.isPinned && (
                    <Badge variant="late" className="flex items-center gap-1 text-[10px]">
                      <Pin className="h-3 w-3" />
                      PINNED
                    </Badge>
                  )}
                  <Badge variant={getPriorityBadgeVariant(ann.priority)} className="text-[10px] font-mono">
                    {ann.priority}
                  </Badge>
                  {ann.laboratory && (
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {ann.laboratory.name}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(ann.createdAt)}
                </span>
              </div>

              <CardTitle className="text-base font-bold text-foreground mt-2">
                {ann.title}
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <User className="h-3 w-3" />
                Disiarkan oleh: <span className="font-medium text-foreground">{ann.publisher.fullName}</span> ({ann.publisher.role})
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {ann.content}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono">
              PUSAT INFORMASI TERPADU
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Pusat Pengumuman & Siaran Laboratorium
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pemberitahuan akademik resmi, perubahan jadwal, pedoman responsi, dan siaran darurat.
          </p>
        </div>
      </div>

      <Suspense fallback={<AnnouncementsSkeleton />}>
        <AnnouncementsContent />
      </Suspense>
    </div>
  );
}
