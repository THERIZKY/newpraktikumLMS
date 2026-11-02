"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus, SessionStatus, AssignmentType } from "@prisma/client";

export async function createClassAction(formData: {
  practicumId: string;
  name: string;
  scheduleDay: string;
  scheduleTime: string;
  room?: string;
  maxStudents?: number;
  autoGenerateSessions?: boolean;
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  const practicum = await prisma.practicum.findUnique({
    where: { id: formData.practicumId },
  });
  if (!practicum) throw new Error("Praktikum tidak ditemukan.");

  const newClass = await prisma.practicumClass.create({
    data: {
      practicumId: formData.practicumId,
      name: formData.name,
      scheduleDay: formData.scheduleDay,
      scheduleTime: formData.scheduleTime,
      room: formData.room || "Lab Utama",
      maxStudents: Number(formData.maxStudents) || 40,
    },
  });

  // Auto-generate 1..N sessions if chosen
  if (formData.autoGenerateSessions) {
    const sessionsData = [];
    const baseDate = new Date();
    for (let i = 1; i <= practicum.totalSessions; i++) {
      const sessionDate = new Date(baseDate);
      sessionDate.setDate(sessionDate.getDate() + (i - 1) * 7);

      sessionsData.push({
        practicumClassId: newClass.id,
        sessionNumber: i,
        title: `Pertemuan ${i}: Modul ${i}`,
        description: `Sesi praktikum ${formData.name} pertemuan ke-${i}`,
        date: sessionDate,
        startTime: formData.scheduleTime.split("-")[0]?.trim() || "08:00",
        endTime: formData.scheduleTime.split("-")[1]?.trim() || "10:30",
        status: i === 1 ? SessionStatus.IN_PROGRESS : SessionStatus.SCHEDULED,
      });
    }

    await prisma.session.createMany({
      data: sessionsData,
    });
  }

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_CLASS",
      entityType: "PracticumClass",
      entityId: newClass.id,
      newValues: { name: newClass.name, day: newClass.scheduleDay, room: newClass.room },
    },
  });

  updateTag(`classes-${formData.practicumId}`);
  updateTag(`practicum-${formData.practicumId}`);
  revalidateTag(`practicum-${formData.practicumId}`, "max");

  return { success: true, data: newClass };
}

export async function enrollStudentAction(formData: {
  practicumClassId: string;
  studentId: string;
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  const pClass = await prisma.practicumClass.findUnique({
    where: { id: formData.practicumClassId },
    include: {
      _count: { select: { studentEnrollments: { where: { status: "ACTIVE" } } } },
    },
  });

  if (!pClass) throw new Error("Kelas tidak ditemukan.");

  if (pClass._count.studentEnrollments >= pClass.maxStudents) {
    throw new Error(`Kapasitas kelas penuh (Maksimal ${pClass.maxStudents} mahasiswa).`);
  }

  const existing = await prisma.studentEnrollment.findUnique({
    where: {
      studentId_practicumClassId: {
        studentId: formData.studentId,
        practicumClassId: formData.practicumClassId,
      },
    },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      throw new Error("Mahasiswa sudah terdaftar aktif di kelas ini.");
    }
    // Reactivate
    await prisma.studentEnrollment.update({
      where: { id: existing.id },
      data: { status: "ACTIVE" },
    });
  } else {
    await prisma.studentEnrollment.create({
      data: {
        studentId: formData.studentId,
        practicumClassId: formData.practicumClassId,
        status: "ACTIVE",
      },
    });
  }

  updateTag(`class-${formData.practicumClassId}`);
  updateTag(`student-dashboard-${formData.studentId}`);
  updateTag(`enrollments-${formData.studentId}`);
  updateTag("practicums");
  revalidateTag(`class-${formData.practicumClassId}`, "max");
  revalidateTag("practicums", "max");

  return { success: true };
}

export async function assignAssistantAction(formData: {
  practicumClassId: string;
  assistantId: string;
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  await prisma.assistantAssignment.upsert({
    where: {
      assistantId_practicumClassId: {
        assistantId: formData.assistantId,
        practicumClassId: formData.practicumClassId,
      },
    },
    update: { assignedAt: new Date() },
    create: {
      assistantId: formData.assistantId,
      practicumClassId: formData.practicumClassId,
    },
  });

  updateTag(`class-${formData.practicumClassId}`);
  updateTag(`assistant-stats-${formData.assistantId}`);
  updateTag("practicums");
  updateTag("grades-overview");
  revalidateTag(`class-${formData.practicumClassId}`, "max");
  revalidateTag("practicums", "max");

  return { success: true };
}

export async function saveBulkAttendanceAction(formData: {
  sessionId: string;
  records: {
    studentEnrollmentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  // Bulk upsert attendances
  await Promise.all(
    formData.records.map((rec) =>
      prisma.attendance.upsert({
        where: {
          sessionId_studentEnrollmentId: {
            sessionId: formData.sessionId,
            studentEnrollmentId: rec.studentEnrollmentId,
          },
        },
        update: {
          status: rec.status,
          notes: rec.notes || null,
          recordedBy: session.user.id,
          checkInTime: new Date(),
        },
        create: {
          sessionId: formData.sessionId,
          studentEnrollmentId: rec.studentEnrollmentId,
          status: rec.status,
          notes: rec.notes || null,
          recordedBy: session.user.id,
          checkInTime: new Date(),
        },
      })
    )
  );

  updateTag(`attendance-session-${formData.sessionId}`);
  updateTag(`session-${formData.sessionId}`);
  revalidateTag(`session-${formData.sessionId}`, "max");

  return { success: true, count: formData.records.length };
}

export async function uploadSessionMaterialAction(formData: {
  sessionId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  const material = await prisma.sessionMaterial.create({
    data: {
      sessionId: formData.sessionId,
      title: formData.title,
      fileName: formData.fileName,
      filePath: formData.filePath,
      fileSize: formData.fileSize,
      mimeType: formData.mimeType,
      uploadedById: session.user.id,
    },
  });

  updateTag(`materials-${formData.sessionId}`);
  updateTag(`session-${formData.sessionId}`);
  revalidateTag(`session-${formData.sessionId}`, "max");

  return { success: true, data: material };
}

export async function createAssignmentAction(formData: {
  practicumId: string;
  sessionId?: string;
  title: string;
  description?: string;
  type: AssignmentType;
  deadline: Date;
  latePenaltyPercentage?: number;
  maxFileSizeMb?: number;
}) {
  const session = await auth();
  if (!session?.user || !["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(session.user.role)) {
    throw new Error("Akses ditolak.");
  }

  const assignment = await prisma.assignment.create({
    data: {
      practicumId: formData.practicumId,
      sessionId: formData.sessionId || null,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      deadline: formData.deadline,
      latePenaltyPercentage: formData.latePenaltyPercentage || 10,
      maxFileSizeMb: formData.maxFileSizeMb || 15,
      allowedFileTypes: ["pdf", "zip", "tar.gz", "ipynb"],
    },
  });

  updateTag(`practicum-${formData.practicumId}`);
  if (formData.sessionId) {
    updateTag(`session-${formData.sessionId}`);
  }
  revalidateTag(`practicum-${formData.practicumId}`, "max");

  return { success: true, data: assignment };
}
