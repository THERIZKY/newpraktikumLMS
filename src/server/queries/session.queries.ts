import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeData } from "@/lib/serialize";

export async function getClassWithDetails(classId: string) {
  "use cache";
  cacheLife("session_schedule");
  cacheTag(`class-${classId}`, `sessions-${classId}`);

  const pClass = await prisma.practicumClass.findUnique({
    where: { id: classId },
    include: {
      practicum: {
        include: {
          laboratory: true,
          gradingComponents: { orderBy: { order: "asc" } },
          gradeLetters: { orderBy: { order: "asc" } },
        },
      },
      sessions: {
        orderBy: { sessionNumber: "asc" },
        include: {
          materials: true,
          assignments: true,
          _count: { select: { attendances: true, grades: true } },
        },
      },
      studentEnrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            select: { id: true, fullName: true, nim: true, email: true, phone: true },
          },
          publishedGrade: true,
        },
        orderBy: { student: { nim: "asc" } },
      },
      assistantAssignments: {
        include: {
          assistant: {
            select: { id: true, fullName: true, nim: true, email: true, phone: true },
          },
        },
      },
    },
  });

  return sanitizeData(pClass);
}

export async function getSessionWorkspace(sessionId: string) {
  "use cache";
  cacheLife("session_schedule");
  cacheTag(`session-${sessionId}`, `materials-${sessionId}`, `attendance-session-${sessionId}`);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      practicumClass: {
        include: {
          practicum: {
            include: {
              gradingComponents: { orderBy: { order: "asc" } },
            },
          },
          studentEnrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                select: { id: true, fullName: true, nim: true, avatarUrl: true },
              },
            },
            orderBy: { student: { nim: "asc" } },
          },
        },
      },
      materials: {
        include: {
          uploader: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      attendances: {
        include: {
          studentEnrollment: {
            include: {
              student: { select: { fullName: true, nim: true } },
            },
          },
        },
      },
      assignments: {
        include: {
          _count: { select: { submissions: true } },
        },
      },
    },
  });

  return sanitizeData(session);
}
