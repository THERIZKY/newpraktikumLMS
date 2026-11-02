"use server";

import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";

export async function submitAssignmentAction(formData: {
  assignmentId: string;
  studentEnrollmentId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  revisionNotes?: string;
  storagePath?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Harap login terlebih dahulu.");
  }

  // Enforce 1MB maximum upload size
  const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
  if (formData.fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error("Ukuran berkas melebihi batas maksimal 1 MB.");
  }

  // Find assignment
  const assignment = await prisma.assignment.findUnique({
    where: { id: formData.assignmentId },
    include: { practicum: true },
  });
  if (!assignment) throw new Error("Tugas tidak ditemukan.");

  // Resolve student enrollment
  let enrollmentId = formData.studentEnrollmentId;
  if (!enrollmentId) {
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: session.user.id,
        practicumClass: { practicumId: assignment.practicumId },
        status: "ACTIVE",
      },
    });
    if (!enrollment) {
      throw new Error("Anda tidak terdaftar aktif di kelas praktikum ini.");
    }
    enrollmentId = enrollment.id;
  }

  const now = new Date();
  const isLate = now > assignment.deadline;
  const initialStatus: SubmissionStatus = isLate ? "LATE" : "SUBMITTED";

  // Check if existing submission exists
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentEnrollmentId: {
        assignmentId: formData.assignmentId,
        studentEnrollmentId: enrollmentId,
      },
    },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  let submissionId = existingSubmission?.id;
  let nextVersionNumber = 1;

  if (existingSubmission) {
    nextVersionNumber = (existingSubmission.versions[0]?.versionNumber || 1) + 1;

    // Update submission record
    await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        status: initialStatus,
        submittedAt: now,
      },
    });
  } else {
    // Create new submission record
    const newSub = await prisma.submission.create({
      data: {
        assignmentId: formData.assignmentId,
        studentEnrollmentId: enrollmentId,
        status: initialStatus,
        submittedAt: now,
      },
    });
    submissionId = newSub.id;
  }

  // Generate storage path: submissions/${practicumId}/${assignmentId}/${studentId}/v${versionNumber}_${fileName}
  const storagePath = formData.storagePath || `submissions/${assignment.practicumId}/${assignment.id}/${session.user.id}/v${nextVersionNumber}_${formData.fileName}`;

  // Create version record
  const version = await prisma.submissionVersion.create({
    data: {
      submissionId: submissionId!,
      versionNumber: nextVersionNumber,
      fileName: formData.fileName,
      filePath: storagePath,
      fileSize: formData.fileSize,
      fileType: formData.fileType,
      revisionNotes: formData.revisionNotes || null,
      uploadedBy: session.user.id,
      uploadedAt: now,
    },
  });

  updateTag("submissions");
  updateTag(`submissions-student-${session.user.id}`);
  updateTag(`submission-${submissionId}`);
  updateTag(`submissions-assignment-${formData.assignmentId}`);
  updateTag(`student-dashboard-${session.user.id}`);
  revalidateTag(`practicum-${assignment.practicumId}`, "max");

  return { success: true, data: version, status: initialStatus };
}

export async function reviewSubmissionAction(formData: {
  submissionId: string;
  assignmentId: string;
  status: "ACCEPTED" | "REVISION_REQUESTED" | "REJECTED" | "UNDER_REVIEW";
  reviewNotes: string;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !["ASSISTANT", "LAB_ADMIN", "SYSTEM_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Hanya asisten atau admin yang memiliki hak memeriksa tugas.");
  }

  const updated = await prisma.submission.update({
    where: { id: formData.submissionId },
    data: {
      status: formData.status,
      reviewNotes: formData.reviewNotes,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
    include: {
      studentEnrollment: true,
      assignment: true,
    },
  });

  // Create notification for student
  await prisma.notification.create({
    data: {
      userId: updated.studentEnrollment.studentId,
      title: `Tugas Telah Diperiksa: ${updated.assignment.title}`,
      message: `Status tugas Anda telah diperbarui menjadi ${formData.status}. Catatan reviewer: ${formData.reviewNotes || "Tidak ada catatan."}`,
      type: "SUBMISSION",
      referenceType: "submission",
      referenceId: updated.id,
    },
  });

  updateTag("submissions");
  updateTag(`submission-${formData.submissionId}`);
  updateTag(`submissions-assignment-${formData.assignmentId}`);
  revalidateTag(`submissions-student-${updated.studentEnrollment.studentId}`, "max");
  revalidateTag(`student-dashboard-${updated.studentEnrollment.studentId}`, "max");

  return { success: true, data: updated };
}

