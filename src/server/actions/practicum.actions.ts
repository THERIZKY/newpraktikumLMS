"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AggregationMethod, Semester } from "@prisma/client";
import { sanitizeData } from "@/lib/serialize";

export async function createPracticumAction(formData: {
  laboratoryId: string;
  name: string;
  code: string;
  description?: string;
  academicYear: string;
  semester: Semester;
  totalSessions: number;
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  if (session.user.role === "LAB_ADMIN") {
    const lab = await prisma.laboratory.findUnique({
      where: { id: formData.laboratoryId },
      select: { adminId: true },
    });
    if (!lab || lab.adminId !== session.user.id) {
      throw new Error("Anda hanya dapat membuka praktikum pada laboratorium yang ditugaskan ke akun Anda.");
    }
  }

  const practicum = await prisma.practicum.create({
    data: {
      laboratoryId: formData.laboratoryId,
      name: formData.name,
      code: formData.code.toUpperCase(),
      description: formData.description,
      academicYear: formData.academicYear,
      semester: formData.semester,
      totalSessions: formData.totalSessions || 10,
    },
  });

  // Default Standard Grading Components
  await prisma.gradingComponent.createMany({
    data: [
      {
        practicumId: practicum.id,
        name: "Laporan Mingguan",
        weight: 0.35,
        order: 1,
        isPerSession: true,
        aggregationMethod: "AVERAGE",
        maxScore: 100,
      },
      {
        practicumId: practicum.id,
        name: "Keaktifan & Pre-Test",
        weight: 0.15,
        order: 2,
        isPerSession: true,
        aggregationMethod: "AVERAGE",
        maxScore: 100,
      },
      {
        practicumId: practicum.id,
        name: "Tugas Akhir / Responsi",
        weight: 0.5,
        order: 3,
        isPerSession: false,
        maxScore: 100,
      },
    ],
  });

  // Default Grade Letter Mappings (A, AB, B, BC, C, D, E)
  await prisma.gradeLetterMapping.createMany({
    data: [
      { practicumId: practicum.id, letter: "A", minScore: 85, maxScore: 100, gradePoint: 4.0, order: 1 },
      { practicumId: practicum.id, letter: "AB", minScore: 80, maxScore: 84.99, gradePoint: 3.5, order: 2 },
      { practicumId: practicum.id, letter: "B", minScore: 70, maxScore: 79.99, gradePoint: 3.0, order: 3 },
      { practicumId: practicum.id, letter: "BC", minScore: 65, maxScore: 69.99, gradePoint: 2.5, order: 4 },
      { practicumId: practicum.id, letter: "C", minScore: 60, maxScore: 64.99, gradePoint: 2.0, order: 5 },
      { practicumId: practicum.id, letter: "D", minScore: 50, maxScore: 59.99, gradePoint: 1.0, order: 6 },
      { practicumId: practicum.id, letter: "E", minScore: 0, maxScore: 49.99, gradePoint: 0.0, order: 7 },
    ],
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_PRACTICUM",
      entityType: "Practicum",
      entityId: practicum.id,
      newValues: { name: practicum.name, code: practicum.code, year: practicum.academicYear },
    },
  });

  updateTag("practicums");
  revalidateTag("practicums", "max");

  return { success: true, data: practicum };
}

export async function saveGradingComponentAction(formData: {
  id?: string;
  practicumId: string;
  name: string;
  weight: number;
  order: number;
  isPerSession: boolean;
  aggregationMethod?: AggregationMethod;
  maxScore: number;
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  let component;
  if (formData.id) {
    component = await prisma.gradingComponent.update({
      where: { id: formData.id },
      data: {
        name: formData.name,
        weight: formData.weight,
        order: formData.order,
        isPerSession: formData.isPerSession,
        aggregationMethod: formData.isPerSession ? formData.aggregationMethod || "AVERAGE" : null,
        maxScore: formData.maxScore,
      },
    });
  } else {
    component = await prisma.gradingComponent.create({
      data: {
        practicumId: formData.practicumId,
        name: formData.name,
        weight: formData.weight,
        order: formData.order,
        isPerSession: formData.isPerSession,
        aggregationMethod: formData.isPerSession ? formData.aggregationMethod || "AVERAGE" : null,
        maxScore: formData.maxScore,
      },
    });
  }

  updateTag(`grading-schema-${formData.practicumId}`);
  updateTag(`practicum-${formData.practicumId}`);
  updateTag("grades-overview");
  updateTag("practicums");
  revalidateTag(`practicum-${formData.practicumId}`, "max");
  revalidateTag("grades-overview", "max");

  return { success: true, data: sanitizeData(component) };
}

export async function deleteGradingComponentAction(componentId: string, practicumId: string) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  await prisma.gradingComponent.delete({
    where: { id: componentId },
  });

  updateTag(`grading-schema-${practicumId}`);
  updateTag(`practicum-${practicumId}`);
  updateTag("grades-overview");
  updateTag("practicums");
  revalidateTag(`practicum-${practicumId}`, "max");
  revalidateTag("grades-overview", "max");

  return { success: true };
}
