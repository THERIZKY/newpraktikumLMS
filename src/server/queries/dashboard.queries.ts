import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeData } from "@/lib/serialize";

/**
 * Shared System Admin Metrics and Audit Feed
 * Direct directive: 'use cache' (shared system catalog)
 */
export async function getSystemAdminStats() {
  "use cache";
  cacheLife("dashboard_stats");
  cacheTag("system-stats", "admin-dashboard", "audit-logs");

  const [
    totalUsers,
    usersByRole,
    totalLabs,
    totalPracticums,
    recentAuditLogs,
    recentAnnouncements,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    prisma.laboratory.count(),
    prisma.practicum.count({ where: { isActive: true } }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, username: true, role: true } },
      },
    }),
    prisma.announcement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        publisher: { select: { fullName: true } },
      },
    }),
  ]);

  const roleCounts: Record<string, number> = {
    SYSTEM_ADMIN: 0,
    LAB_ADMIN: 0,
    ASSISTANT: 0,
    STUDENT: 0,
  };
  usersByRole.forEach((r) => {
    roleCounts[r.role] = r._count.id;
  });

  return sanitizeData({
    totalUsers,
    roleCounts,
    totalLabs,
    totalPracticums,
    recentAuditLogs,
    recentAnnouncements,
  });
}

/**
 * Laboratory Admin Metrics (Per-user private cache)
 */
export async function getLabAdminStats(userId: string) {
  "use cache: private";
  cacheLife("dashboard_stats");
  cacheTag(`lab-admin-stats-${userId}`, `user-${userId}`);

  const managedLabs = await prisma.laboratory.findMany({
    where: { adminId: userId },
    include: {
      practicums: {
        include: {
          classes: {
            include: {
              _count: { select: { studentEnrollments: true, assistantAssignments: true } },
            },
          },
        },
      },
    },
  });

  const labIds = managedLabs.map((l) => l.id);
  const practicumIds = managedLabs.flatMap((l) => l.practicums.map((p) => p.id));

  const [pendingReviewsCount, totalAnnouncements] = await Promise.all([
    prisma.submission.count({
      where: {
        assignment: { practicumId: { in: practicumIds } },
        status: { in: ["SUBMITTED", "LATE", "UNDER_REVIEW"] },
      },
    }),
    prisma.announcement.count({
      where: { laboratoryId: { in: labIds } },
    }),
  ]);

  let totalStudents = 0;
  let totalClasses = 0;
  managedLabs.forEach((lab) => {
    lab.practicums.forEach((p) => {
      totalClasses += p.classes.length;
      p.classes.forEach((c) => {
        totalStudents += c._count.studentEnrollments;
      });
    });
  });

  return sanitizeData({
    managedLabs,
    totalPracticums: practicumIds.length,
    totalClasses,
    totalStudents,
    pendingReviewsCount,
    totalAnnouncements,
  });
}

/**
 * Teaching Assistant Metrics (Per-user private cache)
 */
export async function getAssistantStats(assistantId: string) {
  "use cache: private";
  cacheLife("dashboard_stats");
  cacheTag(`assistant-stats-${assistantId}`, `user-${assistantId}`);

  const assignments = await prisma.assistantAssignment.findMany({
    where: { assistantId },
    include: {
      practicumClass: {
        include: {
          practicum: true,
          sessions: {
            where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
            orderBy: { sessionNumber: "asc" },
            take: 3,
          },
          _count: { select: { studentEnrollments: true } },
        },
      },
    },
  });

  const classIds = assignments.map((a) => a.practicumClassId);

  const pendingSubmissions = await prisma.submission.findMany({
    where: {
      studentEnrollment: { practicumClassId: { in: classIds } },
      status: { in: ["SUBMITTED", "LATE", "UNDER_REVIEW"] },
    },
    take: 6,
    include: {
      assignment: true,
      studentEnrollment: {
        include: {
          student: { select: { fullName: true, nim: true } },
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  let totalStudents = 0;
  assignments.forEach((a) => {
    totalStudents += a.practicumClass._count.studentEnrollments;
  });

  return sanitizeData({
    assignedClasses: assignments.map((a) => a.practicumClass),
    totalStudents,
    pendingSubmissions,
  });
}

/**
 * Student Dashboard & Progress Metrics (Per-user private cache)
 */
export async function getStudentStats(studentId: string) {
  "use cache: private";
  cacheLife("dashboard_stats");
  cacheTag(`student-dashboard-${studentId}`, `enrollments-${studentId}`, "announcements");

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    include: {
      practicumClass: {
        include: {
          practicum: {
            include: {
              laboratory: {
                include: {
                  admin: { select: { fullName: true } },
                },
              },
            },
          },
          assistantAssignments: {
            include: {
              assistant: { select: { fullName: true } },
            },
          },
          sessions: {
            orderBy: { sessionNumber: "asc" },
            include: { materials: true },
          },
        },
      },
      publishedGrade: true,
      attendances: true,
      submissions: {
        include: {
          assignment: true,
          versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        },
      },
    },
  });

  const practicumIds = enrollments.map((e) => e.practicumClass.practicumId);
  const enrolledLabIds = Array.from(
    new Set(enrollments.map((e) => e.practicumClass.practicum.laboratoryId))
  );

  const [upcomingAssignments, recentAnnouncements] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        practicumId: { in: practicumIds },
        deadline: { gte: new Date() },
      },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { practicum: true },
    }),
    prisma.announcement.findMany({
      where: {
        OR: [
          { laboratoryId: null },
          { laboratoryId: { in: enrolledLabIds } },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: {
        laboratory: { select: { name: true, code: true } },
      },
    }),
  ]);

  // Calculate attendance summary
  let totalAttendances = 0;
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let absentCount = 0;

  enrollments.forEach((e) => {
    e.attendances.forEach((att) => {
      totalAttendances++;
      if (att.status === "PRESENT") presentCount++;
      else if (att.status === "LATE") lateCount++;
      else if (att.status === "EXCUSED") excusedCount++;
      else if (att.status === "ABSENT") absentCount++;
    });
  });

  const attendanceRate =
    totalAttendances > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalAttendances) * 100)
      : 100;

  return sanitizeData({
    enrollments,
    upcomingAssignments,
    recentAnnouncements,
    attendanceSummary: {
      rate: attendanceRate,
      present: presentCount,
      late: lateCount,
      excused: excusedCount,
      absent: absentCount,
      total: totalAttendances,
    },
  });
}

