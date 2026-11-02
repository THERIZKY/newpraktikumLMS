import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPracticumGradingMatrix } from "@/server/services/grading.service";
import ExcelJS from "exceljs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Next.js 16 mandatory await
  const session = await auth();

  if (
    !session?.user ||
    !["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matrix = await getPracticumGradingMatrix(id);
  const { practicum, components, students } = matrix;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LMS Praktikum Next.js 16 Edition";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Rekap Nilai Praktikum");

  // Title Headers
  worksheet.mergeCells("A1:G1");
  worksheet.getCell("A1").value = `REKAPITULASI NILAI AKHIR PRAKTIKUM`;
  worksheet.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: "FF0F172A" } };

  worksheet.mergeCells("A2:G2");
  worksheet.getCell("A2").value = `${practicum.name} (${practicum.code}) — Semester ${practicum.semester} ${practicum.academicYear}`;
  worksheet.getCell("A2").font = { name: "Arial", size: 11, bold: false, color: { argb: "FF475569" } };

  worksheet.mergeCells("A3:G3");
  worksheet.getCell("A3").value = `Laboratorium: ${practicum.laboratory.name} | Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID")}`;
  worksheet.getCell("A3").font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } };

  // Table Headers
  const headerRowValues = ["No", "NIM", "Nama Lengkap", "Kelas / Shift"];
  components.forEach((c) => {
    headerRowValues.push(`${c.name} (${Number(c.weight) * 100}%)`);
  });
  headerRowValues.push("Nilai Akhir", "Huruf Mutu", "Bobot Angka", "Status Publikasi");

  const headerRow = worksheet.addRow(headerRowValues);
  headerRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Data Rows
  students.forEach((student, idx) => {
    const rowValues: (string | number)[] = [
      idx + 1,
      student.nim || "-",
      student.fullName,
      student.className,
    ];

    student.components.forEach((c) => {
      rowValues.push(c.rawScore);
    });

    rowValues.push(
      student.finalScore,
      student.letterGrade,
      student.gradePoint,
      student.isPublished ? "Terpublikasi" : "Draft"
    );

    const row = worksheet.addRow(rowValues);
    row.font = { name: "Arial", size: 10 };
    row.alignment = { vertical: "middle" };

    // Center alignment on numbers and codes
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(4).alignment = { horizontal: "center" };

    let colIndex = 5;
    student.components.forEach(() => {
      row.getCell(colIndex).alignment = { horizontal: "right" };
      colIndex++;
    });

    row.getCell(colIndex).alignment = { horizontal: "right" }; // Final score
    row.getCell(colIndex + 1).alignment = { horizontal: "center" }; // Letter
    row.getCell(colIndex + 2).alignment = { horizontal: "right" }; // Point
    row.getCell(colIndex + 3).alignment = { horizontal: "center" }; // Published
  });

  // Auto-fit column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : "";
      if (cellValue.length > maxLength) {
        maxLength = Math.min(cellValue.length + 3, 40);
      }
    });
    column.width = maxLength;
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const sanitizedFileName = `Nilai_${practicum.code.replace(/[^a-zA-Z0-9_-]/g, "_")}_${practicum.semester}_${practicum.academicYear.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${sanitizedFileName}"`,
    },
  });
}
