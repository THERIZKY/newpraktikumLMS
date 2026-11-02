import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";
import { sanitizeData } from "@/lib/serialize";

export async function getSubmissionsList(options: {
  practicumId?: string;
  status?: string;
  studentId?: string;
  assistantId?: string;
  labAdminId?: string;
}) {
  "use cache: private";
  cacheLife("session_schedule");
  cacheTag(
    "submissions",
    options.practicumId ? `submissions-practicum-${options.practicumId}` : "all-submissions",
    options.studentId ? `submissions-student-${options.studentId}` : "staff-submissions"
  );

  const submissionsRaw = await prisma.submission.findMany({
    where: {
      ...(options.practicumId && { assignment: { practicumId: options.practicumId } }),
      ...(options.labAdminId && {
        assignment: {
          ...(options.practicumId && { practicumId: options.practicumId }),
          practicum: { laboratory: { adminId: options.labAdminId } },
        },
      }),
      ...(options.status && { status: options.status as SubmissionStatus }),
      ...(options.studentId && { studentEnrollment: { studentId: options.studentId } }),
      ...(options.assistantId && {
        studentEnrollment: {
          practicumClass: {
            assistantAssignments: { some: { assistantId: options.assistantId } },
          },
        },
      }),
    },
    include: {
      assignment: { select: { id: true, title: true } },
      studentEnrollment: {
        include: {
          student: { select: { fullName: true, nim: true } },
        },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const formattedSubmissions = submissionsRaw.map((s) => ({
    id: s.id,
    assignmentId: s.assignment.id,
    assignmentTitle: s.assignment.title,
    studentName: s.studentEnrollment.student.fullName,
    studentNim: s.studentEnrollment.student.nim,
    status: s.status,
    submittedAt: s.submittedAt,
    reviewedAt: s.reviewedAt,
    reviewNotes: s.reviewNotes,
    versions: s.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      fileName: v.fileName,
      filePath: v.filePath,
      fileSize: v.fileSize,
      revisionNotes: v.revisionNotes,
      uploadedAt: v.uploadedAt,
    })),
  }));

  return sanitizeData(formattedSubmissions);
}

export async function getStudentActiveAssignments(studentId: string) {
  "use cache: private";
  cacheLife("session_schedule");
  cacheTag("submissions", `submissions-student-${studentId}`, `enrollments-${studentId}`);

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    include: {
      practicumClass: {
        include: {
          practicum: {
            include: {
              assignments: {
                orderBy: { deadline: "asc" },
                include: {
                  session: { select: { sessionNumber: true, title: true } },
                },
              },
            },
          },
        },
      },
      submissions: {
        include: {
          versions: { orderBy: { versionNumber: "desc" } },
        },
      },
    },
  });

  const items = enrollments.flatMap((enr) =>
    enr.practicumClass.practicum.assignments.map((asg) => {
      const sub = enr.submissions.find((s) => s.assignmentId === asg.id);
      return {
        assignmentId: asg.id,
        title: asg.title,
        description: asg.description,
        type: asg.type,
        deadline: asg.deadline,
        maxFileSizeMb: asg.maxFileSizeMb,
        allowedFileTypes: asg.allowedFileTypes,
        practicumCode: enr.practicumClass.practicum.code,
        practicumName: enr.practicumClass.practicum.name,
        className: enr.practicumClass.name,
        sessionNumber: asg.session?.sessionNumber || null,
        studentEnrollmentId: enr.id,
        submissionId: sub?.id || null,
        status: sub?.status || "NOT_SUBMITTED",
        submittedAt: sub?.submittedAt || null,
        reviewNotes: sub?.reviewNotes || null,
        latestVersion: sub?.versions?.[0]?.versionNumber || 0,
      };
    })
  );

  return sanitizeData(items);
}

