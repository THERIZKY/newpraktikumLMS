import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Semester } from "@prisma/client";
import { sanitizeData } from "@/lib/serialize";

export async function getPracticums(options?: {
  semester?: Semester;
  academicYear?: string;
  adminId?: string;
  assistantId?: string;
  studentId?: string;
}) {
  "use cache";
  cacheLife("practicum_catalog");
  cacheTag(
    "practicums",
    "labs",
    ...(options?.adminId ? [`lab-admin-stats-${options.adminId}`] : []),
    ...(options?.assistantId ? [`assistant-stats-${options.assistantId}`] : []),
    ...(options?.studentId
      ? [`student-dashboard-${options.studentId}`, `enrollments-${options.studentId}`]
      : [])
  );

  const practicums = await prisma.practicum.findMany({
    where: {
      ...(options?.semester && { semester: options.semester }),
      ...(options?.academicYear && { academicYear: options.academicYear }),
      ...(options?.adminId && { laboratory: { adminId: options.adminId } }),
      ...(options?.assistantId && {
        classes: {
          some: {
            assistantAssignments: { some: { assistantId: options.assistantId } },
          },
        },
      }),
      ...(options?.studentId && {
        classes: {
          some: {
            studentEnrollments: {
              some: { studentId: options.studentId, status: "ACTIVE" },
            },
          },
        },
      }),
      isActive: true,
    },
    include: {
      laboratory: { select: { id: true, name: true, code: true } },
      classes: {
        include: {
          _count: { select: { studentEnrollments: true, assistantAssignments: true } },
        },
      },
      gradingComponents: {
        orderBy: { order: "asc" },
      },
      _count: { select: { assignments: true, classes: true } },
    },
    orderBy: { code: "asc" },
  });

  return sanitizeData(practicums);
}

export async function getPracticumById(practicumId: string) {
  "use cache";
  cacheLife("practicum_catalog");
  cacheTag("practicums", `practicum-${practicumId}`, `grading-schema-${practicumId}`);

  const practicum = await prisma.practicum.findUnique({
    where: { id: practicumId },
    include: {
      laboratory: true,
      gradingComponents: {
        orderBy: { order: "asc" },
      },
      gradeLetters: {
        orderBy: { order: "asc" },
      },
      classes: {
        include: {
          assistantAssignments: {
            include: {
              assistant: { select: { id: true, fullName: true, nim: true, email: true } },
            },
          },
          studentEnrollments: {
            where: { status: "ACTIVE" },
            select: { studentId: true },
          },
          _count: { select: { studentEnrollments: true, sessions: true } },
        },
        orderBy: { name: "asc" },
      },
      assignments: {
        orderBy: { deadline: "asc" },
      },
    },
  });

  return sanitizeData(practicum);
}

export async function getAvailableStudentsForClass(classId: string) {
  "use cache";
  cacheLife("dashboard_stats");
  cacheTag(`class-students-${classId}`, "users-list");

  const enrolled = await prisma.studentEnrollment.findMany({
    where: { practicumClassId: classId },
    select: { studentId: true },
  });
  const enrolledIds = enrolled.map((e) => e.studentId);

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
      id: { notIn: enrolledIds },
    },
    select: { id: true, fullName: true, nim: true },
    orderBy: { nim: "asc" },
    take: 50,
  });

  return sanitizeData(students);
}

export async function getAvailableAssistantsForClass(classId: string) {
  "use cache";
  cacheLife("dashboard_stats");
  cacheTag(`class-assistants-${classId}`, "users-list");

  const assigned = await prisma.assistantAssignment.findMany({
    where: { practicumClassId: classId },
    select: { assistantId: true },
  });
  const assignedIds = assigned.map((a) => a.assistantId);

  const assistants = await prisma.user.findMany({
    where: {
      role: { in: ["ASSISTANT", "LAB_ADMIN"] },
      isActive: true,
      id: { notIn: assignedIds },
    },
    select: { id: true, fullName: true, nim: true },
    orderBy: { fullName: "asc" },
  });

  return sanitizeData(assistants);
}
