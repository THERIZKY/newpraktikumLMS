"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createLaboratoryAction(formData: {
  name: string;
  code: string;
  description?: string;
  adminId?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Hanya System Admin yang memiliki izin membuat laboratorium.");
  }

  const existing = await prisma.laboratory.findUnique({
    where: { code: formData.code },
  });
  if (existing) {
    throw new Error(`Laboratorium dengan kode ${formData.code} sudah ada.`);
  }

  if (formData.adminId) {
    const adminUser = await prisma.user.findUnique({
      where: { id: formData.adminId },
      select: { role: true, isActive: true },
    });
    if (!adminUser || adminUser.role !== "LAB_ADMIN") {
      throw new Error("Pengguna yang dipilih bukan memiliki role LAB_ADMIN.");
    }
  }

  const lab = await prisma.laboratory.create({
    data: {
      name: formData.name,
      code: formData.code.toUpperCase(),
      description: formData.description,
      adminId: formData.adminId || null,
    },
  });

  // Record Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_LABORATORY",
      entityType: "Laboratory",
      entityId: lab.id,
      newValues: { code: lab.code, name: lab.name, adminId: lab.adminId },
    },
  });

  updateTag("labs");
  revalidateTag("labs", "max");

  return { success: true, data: lab };
}

export async function updateLaboratoryAction(formData: {
  labId: string;
  name: string;
  code: string;
  description?: string;
  adminId?: string;
  isActive?: boolean;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !["SYSTEM_ADMIN", "LAB_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Akses ditolak.");
  }

  const oldLab = await prisma.laboratory.findUnique({
    where: { id: formData.labId },
  });
  if (!oldLab) throw new Error("Laboratorium tidak ditemukan.");

  if (session.user.role === "LAB_ADMIN" && oldLab.adminId !== session.user.id) {
    throw new Error("Akses ditolak: Anda hanya dapat mengelola laboratorium yang ditugaskan kepada Anda.");
  }

  if (formData.adminId) {
    const adminUser = await prisma.user.findUnique({
      where: { id: formData.adminId },
      select: { role: true, isActive: true },
    });
    if (!adminUser || adminUser.role !== "LAB_ADMIN") {
      throw new Error("Pengguna yang dipilih bukan memiliki role LAB_ADMIN.");
    }
  }

  const updated = await prisma.laboratory.update({
    where: { id: formData.labId },
    data: {
      name: formData.name,
      code: formData.code.toUpperCase(),
      description: formData.description,
      adminId: formData.adminId || null,
      isActive: formData.isActive !== undefined ? formData.isActive : oldLab.isActive,
    },
  });

  // Record Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE_LABORATORY",
      entityType: "Laboratory",
      entityId: updated.id,
      oldValues: { name: oldLab.name, code: oldLab.code, adminId: oldLab.adminId },
      newValues: { name: updated.name, code: updated.code, adminId: updated.adminId },
    },
  });

  updateTag("labs");
  updateTag(`lab-${formData.labId}`);
  if (oldLab.adminId) {
    updateTag(`lab-admin-stats-${oldLab.adminId}`);
    revalidateTag(`lab-admin-stats-${oldLab.adminId}`, "max");
  }
  if (formData.adminId && formData.adminId !== oldLab.adminId) {
    updateTag(`lab-admin-stats-${formData.adminId}`);
    revalidateTag(`lab-admin-stats-${formData.adminId}`, "max");
  }
  revalidateTag("labs", "max");

  return { success: true, data: updated };
}

export async function deleteLaboratoryAction(labId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    throw new Error("Hanya System Admin yang dapat menghapus laboratorium.");
  }

  await prisma.laboratory.delete({
    where: { id: labId },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE_LABORATORY",
      entityType: "Laboratory",
      entityId: labId,
    },
  });

  updateTag("labs");
  revalidateTag("labs", "max");

  return { success: true };
}
