"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateStudentGrade } from "@/server/services/grading.service";
import { sanitizeData } from "@/lib/serialize";

export async function saveGradeScoreAction(formData: {
  studentEnrollmentId: string;
  gradingComponentId: string;
  sessionId?: string;
  score: number;
  feedback?: string;
  practicumId: string;
  classId?: string;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !["ASSISTANT", "LAB_ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Akses ditolak.");
  }

  // Find existing grade for this component (and session if per-session)
  const existing = await prisma.grade.findFirst({
    where: {
      studentEnrollmentId: formData.studentEnrollmentId,
      gradingComponentId: formData.gradingComponentId,
      sessionId: formData.sessionId || null,
    },
  });

  let grade;
  if (existing) {
    grade = await prisma.grade.update({
      where: { id: existing.id },
      data: {
        score: formData.score,
        feedback: formData.feedback || existing.feedback,
        gradedBy: session.user.id,
        gradedAt: new Date(),
      },
    });
  } else {
    grade = await prisma.grade.create({
      data: {
        studentEnrollmentId: formData.studentEnrollmentId,
        gradingComponentId: formData.gradingComponentId,
        sessionId: formData.sessionId || null,
        score: formData.score,
        feedback: formData.feedback || null,
        gradedBy: session.user.id,
      },
    });
  }

  if (formData.classId) {
    updateTag(`grades-class-${formData.classId}`);
  }
  updateTag(`practicum-${formData.practicumId}`);
  revalidateTag(`practicum-${formData.practicumId}`, "max");

  return { success: true, data: sanitizeData(grade) };
}

export async function publishFinalGradesAction(formData: {
  practicumId: string;
  enrollmentIds: string[];
}) {
  const session = await auth();
  if (
    !session?.user ||
    !["LAB_ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Hanya Kepala Laboratorium atau System Admin yang berhak mempublikasikan nilai akhir.");
  }

  const results = [];
  for (const enrId of formData.enrollmentIds) {
    const calc = await calculateStudentGrade(enrId);

    const published = await prisma.publishedGrade.upsert({
      where: { studentEnrollmentId: enrId },
      update: {
        finalScore: calc.finalScore,
        letterGrade: calc.letterGrade,
        gradePoint: calc.gradePoint,
        publishedBy: session.user.id,
        publishedAt: new Date(),
      },
      create: {
        studentEnrollmentId: enrId,
        finalScore: calc.finalScore,
        letterGrade: calc.letterGrade,
        gradePoint: calc.gradePoint,
        publishedBy: session.user.id,
        publishedAt: new Date(),
      },
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: calc.studentId,
        title: "Nilai Akhir Praktikum Telah Dipublikasikan",
        message: `Nilai akhir Anda telah resmi dipublikasikan dengan Skor: ${calc.finalScore.toFixed(2)}, Huruf: ${calc.letterGrade} (${calc.gradePoint.toFixed(2)}).`,
        type: "GRADE",
        referenceType: "published_grade",
        referenceId: published.id,
      },
    });

    results.push(published);
  }

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PUBLISH_GRADES",
      entityType: "Practicum",
      entityId: formData.practicumId,
      newValues: { totalPublished: results.length },
    },
  });

  updateTag(`practicum-${formData.practicumId}`);
  updateTag("student-dashboard");
  revalidateTag(`practicum-${formData.practicumId}`, "max");

  return { success: true, count: results.length };
}
