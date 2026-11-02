"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnnouncementPriority } from "@prisma/client";

export async function createAnnouncementAction(formData: {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  laboratoryId?: string;
  practicumId?: string;
  isPinned?: boolean;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(session.user.role)
  ) {
    throw new Error("Akses ditolak.");
  }

  const ann = await prisma.announcement.create({
    data: {
      title: formData.title,
      content: formData.content,
      priority: formData.priority || "NORMAL",
      laboratoryId: formData.laboratoryId || null,
      practicumId: formData.practicumId || null,
      isPinned: !!formData.isPinned,
      publishedBy: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_ANNOUNCEMENT",
      entityType: "Announcement",
      entityId: ann.id,
      newValues: { title: ann.title, priority: ann.priority },
    },
  });

  updateTag("announcements");
  if (formData.laboratoryId) {
    updateTag(`announcements-lab-${formData.laboratoryId}`);
  }
  revalidateTag("announcements", "max");

  return { success: true, data: ann };
}
