try {
  process.loadEnvFile();
} catch {
  // Ignore if .env doesn't exist
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/praktikum_lms?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Memulai seeding database LMS Praktikum...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Core Users for 4 Roles
  await prisma.user.upsert({
    where: { username: "sysadmin" },
    update: {},
    create: {
      username: "sysadmin",
      fullName: "Dr. Eng. Super Administrator, M.T.",
      email: "admin@lms-praktikum.ac.id",
      role: "SYSTEM_ADMIN",
      passwordHash,
      isActive: true,
    },
  });

  const labAdmin = await prisma.user.upsert({
    where: { username: "labadmin" },
    update: {},
    create: {
      username: "labadmin",
      fullName: "Ir. Hendra Kusuma, Ph.D. (Kepala Lab)",
      email: "hendra@lab.ac.id",
      role: "LAB_ADMIN",
      passwordHash,
      isActive: true,
    },
  });

  const assistant = await prisma.user.upsert({
    where: { username: "asprak1" },
    update: {},
    create: {
      username: "asprak1",
      nim: "21120121130080",
      fullName: "Raditya Pratama (Koordinator Asprak)",
      email: "raditya@student.ac.id",
      phone: "081234567890",
      role: "ASSISTANT",
      passwordHash,
      isActive: true,
    },
  });

  const student1 = await prisma.user.upsert({
    where: { username: "21120120140001" },
    update: {},
    create: {
      username: "21120120140001",
      nim: "21120120140001",
      fullName: "Bintang Anugrah Mahasiswa",
      email: "bintang@student.ac.id",
      phone: "081234567891",
      role: "STUDENT",
      passwordHash,
      isActive: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { username: "21120120140002" },
    update: {},
    create: {
      username: "21120120140002",
      nim: "21120120140002",
      fullName: "Devi Kusuma Wardani",
      email: "devi@student.ac.id",
      phone: "081234567892",
      role: "STUDENT",
      passwordHash,
      isActive: true,
    },
  });

  console.log("✓ Pengguna 4 roles berhasil disiapkan");

  // 2. Create Laboratories
  const labRPL = await prisma.laboratory.upsert({
    where: { code: "LAB-RPL" },
    update: { adminId: labAdmin.id },
    create: {
      name: "Laboratorium Rekayasa Perangkat Lunak",
      code: "LAB-RPL",
      description: "Gedung E Lantai 3, 45 Unit Workstation Intel i7, Riset Web & Mobile.",
      adminId: labAdmin.id,
      isActive: true,
    },
  });

  await prisma.laboratory.upsert({
    where: { code: "LAB-JARKOM" },
    update: { adminId: labAdmin.id },
    create: {
      name: "Laboratorium Jaringan Komputer & Sistem Siber",
      code: "LAB-JARKOM",
      description: "Gedung E Lantai 2, Switch Cisco, Router Mikrotik & Cloud Rack.",
      adminId: labAdmin.id,
      isActive: true,
    },
  });

  console.log("✓ Laboratorium berhasil disiapkan");

  // 3. Create Practicum
  const practicum = await prisma.practicum.upsert({
    where: {
      laboratoryId_code_academicYear_semester: {
        laboratoryId: labRPL.id,
        code: "PRAK-RPL-01",
        academicYear: "2026/2027",
        semester: "EVEN",
      },
    },
    update: {},
    create: {
      laboratoryId: labRPL.id,
      name: "Praktikum Rekayasa Perangkat Lunak Terpadu",
      code: "PRAK-RPL-01",
      description: "Pengembangan web modern Next.js 16, arsitektur microservices, REST API & Prisma ORM.",
      academicYear: "2026/2027",
      semester: "EVEN",
      totalSessions: 10,
      isActive: true,
    },
  });

  // 4. Create Grading Components
  const existingComponents = await prisma.gradingComponent.findMany({
    where: { practicumId: practicum.id },
  });

  if (existingComponents.length === 0) {
    await prisma.gradingComponent.createMany({
      data: [
        {
          practicumId: practicum.id,
          name: "Laporan Mingguan",
          weight: 0.35,
          order: 1,
          isPerSession: true,
          aggregationMethod: "AVERAGE",
          maxScore: 100,
        },
        {
          practicumId: practicum.id,
          name: "Keaktifan & Pre-Test",
          weight: 0.15,
          order: 2,
          isPerSession: true,
          aggregationMethod: "AVERAGE",
          maxScore: 100,
        },
        {
          practicumId: practicum.id,
          name: "Responsi & Proyek Akhir",
          weight: 0.5,
          order: 3,
          isPerSession: false,
          maxScore: 100,
        },
      ],
    });
  }

  // 5. Create Grade Letter Mapping
  const existingLetters = await prisma.gradeLetterMapping.findMany({
    where: { practicumId: practicum.id },
  });

  if (existingLetters.length === 0) {
    await prisma.gradeLetterMapping.createMany({
      data: [
        { practicumId: practicum.id, letter: "A", minScore: 85, maxScore: 100, gradePoint: 4.0, order: 1 },
        { practicumId: practicum.id, letter: "AB", minScore: 80, maxScore: 84.99, gradePoint: 3.5, order: 2 },
        { practicumId: practicum.id, letter: "B", minScore: 70, maxScore: 79.99, gradePoint: 3.0, order: 3 },
        { practicumId: practicum.id, letter: "BC", minScore: 65, maxScore: 69.99, gradePoint: 2.5, order: 4 },
        { practicumId: practicum.id, letter: "C", minScore: 60, maxScore: 64.99, gradePoint: 2.0, order: 5 },
        { practicumId: practicum.id, letter: "D", minScore: 50, maxScore: 59.99, gradePoint: 1.0, order: 6 },
        { practicumId: practicum.id, letter: "E", minScore: 0, maxScore: 49.99, gradePoint: 0.0, order: 7 },
      ],
    });
  }

  // 6. Create Practicum Class
  let pClass = await prisma.practicumClass.findFirst({
    where: { practicumId: practicum.id, name: "Shift A - Senin Pagi" },
  });

  if (!pClass) {
    pClass = await prisma.practicumClass.create({
      data: {
        practicumId: practicum.id,
        name: "Shift A - Senin Pagi",
        scheduleDay: "Senin",
        scheduleTime: "08:00 - 10:30",
        room: "Gedung E Lab 301",
        maxStudents: 40,
        isActive: true,
      },
    });

    // Generate 10 sessions
    for (let i = 1; i <= 10; i++) {
      const sessDate = new Date();
      sessDate.setDate(sessDate.getDate() + (i - 1) * 7);

      const session = await prisma.session.create({
        data: {
          practicumClassId: pClass.id,
          sessionNumber: i,
          title: `Pertemuan ${i}: Modul ${i}`,
          description: `Sesi praktikum ${pClass.name} pertemuan ke-${i}`,
          date: sessDate,
          startTime: "08:00",
          endTime: "10:30",
          status: i === 1 ? "IN_PROGRESS" : "SCHEDULED",
        },
      });

      if (i === 1) {
        // Add sample material
        await prisma.sessionMaterial.create({
          data: {
            sessionId: session.id,
            title: "Modul 01: Setup Next.js 16 & TypeScript",
            fileName: "Modul_01_Setup_NextJS16.pdf",
            filePath: `materials/${session.id}/Modul_01_Setup_NextJS16.pdf`,
            fileSize: 2450000,
            mimeType: "application/pdf",
            uploadedById: assistant.id,
          },
        });

        // Add sample assignment
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        await prisma.assignment.create({
          data: {
            practicumId: practicum.id,
            sessionId: session.id,
            title: "Laporan 01: Inisialisasi Arsitektur Web Next.js 16",
            description: "Kerjakan laporan praktikum sesuai rubrik pedoman Modul 01.",
            type: "LAB_REPORT",
            deadline,
            latePenaltyPercentage: 10,
            maxFileSizeMb: 15,
            allowedFileTypes: ["pdf", "zip"],
          },
        });
      }
    }
  }

  // 7. Enroll Students and Assign Assistant
  await prisma.assistantAssignment.upsert({
    where: {
      assistantId_practicumClassId: {
        assistantId: assistant.id,
        practicumClassId: pClass.id,
      },
    },
    update: {},
    create: {
      assistantId: assistant.id,
      practicumClassId: pClass.id,
    },
  });

  await prisma.studentEnrollment.upsert({
    where: {
      studentId_practicumClassId: {
        studentId: student1.id,
        practicumClassId: pClass.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      practicumClassId: pClass.id,
      status: "ACTIVE",
    },
  });

  await prisma.studentEnrollment.upsert({
    where: {
      studentId_practicumClassId: {
        studentId: student2.id,
        practicumClassId: pClass.id,
      },
    },
    update: {},
    create: {
      studentId: student2.id,
      practicumClassId: pClass.id,
      status: "ACTIVE",
    },
  });

  // 8. Create sample announcement
  const existingAnn = await prisma.announcement.findFirst({
    where: { title: "Selamat Datang di Portal LMS Praktikum Semester Genap 2026/2027" },
  });

  if (!existingAnn) {
    await prisma.announcement.create({
      data: {
        title: "Selamat Datang di Portal LMS Praktikum Semester Genap 2026/2027",
        content:
          "Seluruh praktikan diwajibkan memeriksa jadwal shift kelas, mengunduh modul sesi pertemuan, dan memperhatikan batas waktu pengumpulan laporan mingguan.",
        priority: "HIGH",
        isPinned: true,
        laboratoryId: labRPL.id,
        practicumId: practicum.id,
        publishedBy: labAdmin.id,
      },
    });
  }

  console.log("✅ Seeding database LMS Praktikum berhasil diselesaikan!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
