import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sanitizeData } from "@/lib/serialize";

export async function getAuditLogs() {
  "use cache: private";
  cacheLife("dashboard_stats");
  cacheTag("audit-logs");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { fullName: true, username: true, role: true },
      },
    },
  });

  return sanitizeData(logs);
}

export async function getSystemSettings() {
  "use cache";
  cacheLife("semester_static");
  cacheTag("system-settings");

  let settings = await prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
  });

  if (settings.length === 0) {
    await prisma.systemSetting.createMany({
      data: [
        {
          key: "ACADEMIC_YEAR_CURRENT",
          value: "2026/2027",
          description: "Tahun akademik aktif untuk katalog praktikum baru",
        },
        {
          key: "SEMESTER_CURRENT",
          value: "GENAP",
          description: "Periode semester berjalan (Ganjil / Genap)",
        },
        {
          key: "MAX_FILE_SIZE_MB_DEFAULT",
          value: "15",
          description: "Batas ukuran berkas pengumpulan laporan (MB)",
        },
        {
          key: "LATE_PENALTY_DEFAULT_PERCENT",
          value: "10",
          description: "Pengurangan nilai default per hari keterlambatan (%)",
        },
      ],
      skipDuplicates: true,
    });
    settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  }

  return sanitizeData(settings);
}
