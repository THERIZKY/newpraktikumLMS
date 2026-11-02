import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeData } from "@/lib/serialize";

export async function getUserNotifications(userId: string) {
  "use cache: private";
  cacheLife("dashboard_stats");
  cacheTag(`notifications-${userId}`);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return sanitizeData(notifications);
}
