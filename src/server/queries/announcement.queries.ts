import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeData } from "@/lib/serialize";

export async function getAnnouncements() {
  "use cache";
  cacheLife("practicum_catalog");
  cacheTag("announcements");

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      laboratory: { select: { id: true, code: true, name: true } },
      publisher: { select: { id: true, fullName: true, role: true } },
    },
  });

  return sanitizeData(announcements);
}

export async function getActiveLaboratories(adminId?: string) {
  "use cache";
  cacheLife("semester_static");
  cacheTag("labs", ...(adminId ? [`lab-admin-stats-${adminId}`] : []));

  const laboratories = await prisma.laboratory.findMany({
    where: {
      isActive: true,
      ...(adminId && { adminId }),
    },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return sanitizeData(laboratories);
}
