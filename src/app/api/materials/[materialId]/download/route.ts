import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const { materialId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const material = await prisma.sessionMaterial.findUnique({
    where: { id: materialId },
    include: {
      session: {
        include: {
          practicumClass: {
            include: { practicum: true },
          },
        },
      },
      uploader: { select: { fullName: true } },
    },
  });

  if (!material) {
    return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
  }

  if (material.filePath.startsWith("http://") || material.filePath.startsWith("https://")) {
    return NextResponse.redirect(material.filePath);
  }

  const content = [
    `=============================================================`,
    `MODUL & MATERI SESI PRAKTIKUM — LMS PRAKTIKUM`,
    `=============================================================`,
    `Praktikum : ${material.session.practicumClass.practicum.name} (${material.session.practicumClass.practicum.code})`,
    `Kelas     : ${material.session.practicumClass.name}`,
    `Sesi      : Pertemuan ${material.session.sessionNumber} - ${material.session.title}`,
    `Judul     : ${material.title}`,
    `Nama File : ${material.fileName}`,
    `Path      : ${material.filePath}`,
    `Diunggah  : ${material.uploader.fullName} (${material.createdAt.toISOString()})`,
    `=============================================================`,
  ].join("\n");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": material.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${material.fileName.replace(/"/g, "")}"`,
    },
  });
}
