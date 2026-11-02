"use server";

import { updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function updateProfileAction(formData: {
  fullName: string;
  email?: string;
  phone?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      fullName: formData.fullName.trim(),
      email: formData.email ? formData.email.trim() : null,
      phone: formData.phone || null,
    },
  });

  updateTag(`user-${session.user.id}`);
  return { success: true, data: updated };
}

export async function changePasswordAction(formData: {
  oldPass: string;
  newPass: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  const isValid = await bcrypt.compare(formData.oldPass, user.passwordHash);
  if (!isValid) {
    throw new Error("Password lama salah.");
  }

  const newHash = await bcrypt.hash(formData.newPass, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CHANGE_PASSWORD",
      entityType: "User",
      entityId: user.id,
    },
  });

  return { success: true };
}
