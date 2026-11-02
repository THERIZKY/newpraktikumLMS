import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeData } from "@/lib/serialize";

export async function getLaboratories(adminId?: string) {
  "use cache";
  cacheLife("practicum_catalog");
  cacheTag("labs", ...(adminId ? [`lab-admin-stats-${adminId}`] : []));

  const labs = await prisma.laboratory.findMany({
    where: {
      ...(adminId && { adminId }),
    },
    orderBy: { code: "asc" },
    include: {
      admin: {
        select: { id: true, fullName: true, username: true, email: true },
      },
      practicums: {
        where: { isActive: true },
        select: { id: true, code: true, name: true, semester: true, academicYear: true },
      },
      _count: {
        select: { practicums: true, announcements: true },
      },
    },
  });

  return sanitizeData(labs);
}

export async function getLaboratoryById(labId: string) {
  "use cache";
  cacheLife("practicum_catalog");
  cacheTag("labs", `lab-${labId}`);

  const lab = await prisma.laboratory.findUnique({
    where: { id: labId },
    include: {
      admin: {
        select: { id: true, fullName: true, username: true, email: true, phone: true },
      },
      practicums: {
        include: {
          classes: {
            include: {
              _count: {
                select: { studentEnrollments: true, assistantAssignments: true, sessions: true },
              },
            },
          },
        },
        orderBy: { code: "asc" },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          publisher: { select: { fullName: true } },
        },
      },
    },
  });

  return sanitizeData(lab);
}

export async function getPotentialLabAdmins() {
  "use cache";
  cacheLife("dashboard_stats");
  cacheTag("users-list");

  const users = await prisma.user.findMany({
    where: { role: "LAB_ADMIN", isActive: true },
    select: { id: true, fullName: true, role: true },
    orderBy: { fullName: "asc" },
  });

  return sanitizeData(users);
}
