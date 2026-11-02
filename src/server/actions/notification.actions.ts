"use server";

import { updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationAsReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true, readAt: new Date() },
  });

  updateTag(`notifications-${session.user.id}`);
  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  updateTag(`notifications-${session.user.id}`);
  return { success: true };
}
