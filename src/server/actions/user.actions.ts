"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function createUserAction(formData: {
  username: string;
  fullName: string;
  email?: string;
  nim?: string;
  phone?: string;
  role: UserRole;
  password?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Hanya System Admin yang memiliki izin membuat akun baru.");
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: formData.username },
        ...(formData.nim ? [{ nim: formData.nim }] : []),
        ...(formData.email ? [{ email: formData.email }] : []),
      ],
    },
  });

  if (existing) {
    throw new Error("Username, NIM, atau Email sudah terdaftar pada pengguna lain.");
  }

  const rawPassword = formData.password || "password123";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.create({
    data: {
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email ? formData.email.trim() : null,
      nim: formData.nim ? formData.nim.trim() : null,
      phone: formData.phone || null,
      role: formData.role,
      passwordHash,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_USER",
      entityType: "User",
      entityId: user.id,
      newValues: { username: user.username, role: user.role, nim: user.nim },
    },
  });

  updateTag("system-stats");
  revalidateTag("admin-dashboard", "max");

  return { success: true, data: user };
}

export async function bulkImportStudentsAction(
  students: {
    nim: string;
    fullName: string;
    email?: string;
    phone?: string;
  }[]
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Akses ditolak.");
  }

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  let createdCount = 0;
  let skippedCount = 0;

  for (const s of students) {
    if (!s.nim || !s.fullName) continue;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: s.nim },
          { nim: s.nim },
          ...(s.email ? [{ email: s.email }] : []),
        ],
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    await prisma.user.create({
      data: {
        username: s.nim.trim(),
        nim: s.nim.trim(),
        fullName: s.fullName.trim(),
        email: s.email ? s.email.trim() : null,
        phone: s.phone || null,
        role: "STUDENT",
        passwordHash: defaultPasswordHash,
        isActive: true,
      },
    });

    createdCount++;
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "BULK_IMPORT_STUDENTS",
      entityType: "User",
      newValues: { totalImported: createdCount, skipped: skippedCount },
    },
  });

  updateTag("system-stats");
  revalidateTag("admin-dashboard", "max");

  return { success: true, createdCount, skippedCount };
}

export async function toggleUserStatusAction(userId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Akses ditolak.");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      entityType: "User",
      entityId: userId,
    },
  });

  updateTag("system-stats");
  return { success: true, data: updated };
}
