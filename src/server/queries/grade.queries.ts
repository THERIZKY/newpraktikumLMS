import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeData } from "@/lib/serialize";

export async function getStudentEnrollmentGrades(studentId: string) {
  "use cache: private";
  cacheLife("dashboard_stats");
  cacheTag(`student-grades-${studentId}`, `student-dashboard-${studentId}`);

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { studentId },
    include: {
      practicumClass: {
        include: {
          practicum: {
            include: {
              laboratory: true,
              gradingComponents: { orderBy: { order: "asc" } },
            },
          },
        },
      },
      publishedGrade: true,
      grades: true,
      attendances: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return sanitizeData(enrollments);
}

export async function getPracticumsGradesOverview(options?: {
  adminId?: string;
  assistantId?: string;
}) {
  "use cache";
  cacheLife("dashboard_stats");
  cacheTag(
    "practicums",
    "grades-overview",
    "labs",
    ...(options?.adminId ? [`lab-admin-stats-${options.adminId}`] : []),
    ...(options?.assistantId ? [`assistant-stats-${options.assistantId}`] : [])
  );

  const practicums = await prisma.practicum.findMany({
    where: {
      isActive: true,
      ...(options?.adminId && { laboratory: { adminId: options.adminId } }),
      ...(options?.assistantId && {
        classes: {
          some: {
            assistantAssignments: { some: { assistantId: options.assistantId } },
          },
        },
      }),
    },
    include: {
      laboratory: true,
      classes: {
        include: {
          _count: { select: { studentEnrollments: true } },
        },
      },
      gradingComponents: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { code: "asc" },
  });

  return sanitizeData(practicums);
}
