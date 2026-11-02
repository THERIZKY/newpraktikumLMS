import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ submissionId: string; versionId: string }>;
  }
) {
  const { submissionId, versionId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const version = await prisma.submissionVersion.findUnique({
    where: { id: versionId },
    include: {
      submission: {
        include: {
          assignment: { include: { practicum: true } },
          studentEnrollment: {
            include: { student: { select: { fullName: true, nim: true } } },
          },
        },
      },
    },
  });

  if (!version || version.submissionId !== submissionId) {
    return NextResponse.json(
      { error: "Versi pengumpulan tugas tidak ditemukan." },
      { status: 404 }
    );
  }

  if (version.filePath.startsWith("http://") || version.filePath.startsWith("https://")) {
    return NextResponse.redirect(version.filePath);
  }

  // If path starts with submissions/ (Supabase Storage path rule)
  if (version.filePath.startsWith("submissions/")) {
    const { supabaseAdmin, SUBMISSION_BUCKET } = await import("@/lib/supabase");
    // Generate signed download URL (valid for 60 seconds)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(SUBMISSION_BUCKET)
      .createSignedUrl(version.filePath, 60, {
        download: `v${version.versionNumber}_${version.fileName}`,
      });

    if (signedData?.signedUrl) {
      return NextResponse.redirect(signedData.signedUrl);
    }
  }

  const content = [
    `=============================================================`,
    `BERKAS PENGUMPULAN TUGAS PRAKTIKUM (MULTI-VERSION)`,
    `=============================================================`,
    `Praktikum     : ${version.submission.assignment.practicum.name} (${version.submission.assignment.practicum.code})`,
    `Tugas         : ${version.submission.assignment.title}`,
    `Praktikan     : ${version.submission.studentEnrollment.student.fullName} (${version.submission.studentEnrollment.student.nim || "-"})`,
    `Versi Berkas  : v${version.versionNumber}`,
    `Nama Berkas   : ${version.fileName}`,
    `Storage Path  : ${version.filePath}`,
    `Catatan Revisi: ${version.revisionNotes || "-"}`,
    `Waktu Unggah  : ${version.uploadedAt.toISOString()}`,
    `=============================================================`,
  ].join("\n");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": version.fileType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="v${version.versionNumber}_${version.fileName.replace(/"/g, "")}"`,
    },
  });
}
