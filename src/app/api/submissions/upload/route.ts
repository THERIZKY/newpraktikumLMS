import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, SUBMISSION_BUCKET } from "@/lib/supabase";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Harap login terlebih dahulu." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const assignmentId = formData.get("assignmentId") as string | null;
    const revisionNotes = (formData.get("revisionNotes") as string) || undefined;
    const customEnrollmentId = (formData.get("studentEnrollmentId") as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 400 });
    }

    if (!assignmentId) {
      return NextResponse.json({ error: "ID Tugas wajib diisi." }, { status: 400 });
    }

    // 1 MB limit (1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Ukuran berkas (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal 1 MB.` },
        { status: 400 }
      );
    }

    // Fetch assignment & practicum
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { practicum: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    }

    // Validate enrollment
    let enrollmentId = customEnrollmentId;
    if (!enrollmentId) {
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          studentId: session.user.id,
          practicumClass: { practicumId: assignment.practicumId },
          status: "ACTIVE",
        },
      });
      if (!enrollment) {
        return NextResponse.json(
          { error: "Anda tidak terdaftar aktif di kelas praktikum ini." },
          { status: 403 }
        );
      }
      enrollmentId = enrollment.id;
    }

    const now = new Date();
    const isLate = now > assignment.deadline;
    const initialStatus = isLate ? "LATE" : "SUBMITTED";

    // Check existing submission and versions
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentEnrollmentId: {
          assignmentId,
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
      await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          status: initialStatus,
          submittedAt: now,
        },
      });
    } else {
      const newSub = await prisma.submission.create({
        data: {
          assignmentId,
          studentEnrollmentId: enrollmentId,
          status: initialStatus,
          submittedAt: now,
        },
      });
      submissionId = newSub.id;
    }

    // Sanitized file name & format rule from GEMINI.md:
    // submissions/${practicumId}/${assignmentId}/${studentId}/v${versionNumber}_${fileName}
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `submissions/${assignment.practicumId}/${assignment.id}/${session.user.id}/v${nextVersionNumber}_${cleanFileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUBMISSION_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return NextResponse.json(
        {
          error: `Gagal mengunggah berkas ke storage: ${uploadError.message}. Pastikan bucket "${SUBMISSION_BUCKET}" sudah dibuat di dashboard Supabase.`,
        },
        { status: 500 }
      );
    }

    // Save SubmissionVersion record
    const version = await prisma.submissionVersion.create({
      data: {
        submissionId: submissionId!,
        versionNumber: nextVersionNumber,
        fileName: cleanFileName,
        filePath: storagePath,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        revisionNotes: revisionNotes || null,
        uploadedBy: session.user.id,
        uploadedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: version,
      status: initialStatus,
      versionNumber: nextVersionNumber,
    });
  } catch (error: unknown) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Terjadi kesalahan internal saat mengunggah berkas." },
      { status: 500 }
    );
  }
}
