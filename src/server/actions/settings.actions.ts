"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveSystemSettingAction(formData: {
  key: string;
  value: string;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Akses ditolak.");
  }

  const setting = await prisma.systemSetting.upsert({
    where: { key: formData.key },
    update: {
      value: formData.value,
      description: formData.description,
      updatedBy: session.user.id,
    },
    create: {
      key: formData.key,
      value: formData.value,
      description: formData.description,
      updatedBy: session.user.id,
    },
  });

  updateTag("system-settings");
  revalidateTag("system-settings", "max");

  return { success: true, data: setting };
}
