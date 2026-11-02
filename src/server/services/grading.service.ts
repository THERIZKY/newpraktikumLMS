import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AggregationMethod } from "@prisma/client";
import { sanitizeData } from "@/lib/serialize";

export interface ComponentCalculationResult {
  componentId: string;
  componentName: string;
  weight: number;
  rawScore: number;
  maxScore: number;
  weightedScore: number;
}

export interface StudentGradeResult {
  studentEnrollmentId: string;
  studentId: string;
  nim?: string | null;
  fullName: string;
  className: string;
  components: ComponentCalculationResult[];
  finalScore: number;
  letterGrade: string;
  gradePoint: number;
  isPublished: boolean;
}

/**
 * Calculates raw score for a component based on session aggregation rules
 */
export function aggregateSessionScores(
  scores: number[],
  method: AggregationMethod | null
): number {
  if (scores.length === 0) return 0;

  switch (method) {
    case "SUM":
      return scores.reduce((a, b) => a + b, 0);
    case "HIGHEST":
      return Math.max(...scores);
    case "LATEST":
      return scores[scores.length - 1] || 0;
    case "AVERAGE":
    default:
      return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
}

/**
 * Calculates final score and determines letter grade according to projectPraktikum specification
 */
export async function calculateStudentGrade(
  studentEnrollmentId: string
): Promise<StudentGradeResult> {
  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: studentEnrollmentId },
    include: {
      student: { select: { id: true, fullName: true, nim: true } },
      practicumClass: {
        include: {
          practicum: {
            include: {
              gradingComponents: { orderBy: { order: "asc" } },
              gradeLetters: { orderBy: { order: "asc" } },
            },
          },
        },
      },
      grades: {
        include: { session: true },
        orderBy: { session: { sessionNumber: "asc" } },
      },
      publishedGrade: true,
    },
  });

  if (!enrollment) {
    throw new Error("Enrollment mahasiswa tidak ditemukan.");
  }

  const { practicum } = enrollment.practicumClass;
  const componentsResult: ComponentCalculationResult[] = [];
  let totalWeightedScore = 0;

  for (const comp of practicum.gradingComponents) {
    const componentGrades = enrollment.grades.filter(
      (g) => g.gradingComponentId === comp.id
    );

    let rawScore = 0;
    if (comp.isPerSession) {
      const sessionScores = componentGrades.map((g) => Number(g.score));
      rawScore = aggregateSessionScores(sessionScores, comp.aggregationMethod);
    } else {
      // Single component score
      const latest = componentGrades[0];
      rawScore = latest ? Number(latest.score) : 0;
    }

    const maxScore = Number(comp.maxScore) || 100;
    const weight = Number(comp.weight); // e.g. 0.35

    // weightedScore = (rawScore / maxScore) * weight * 100
    const weightedScore = (rawScore / maxScore) * weight * 100;
    totalWeightedScore += weightedScore;

    componentsResult.push({
      componentId: comp.id,
      componentName: comp.name,
      weight,
      rawScore: Math.round(rawScore * 100) / 100,
      maxScore,
      weightedScore: Math.round(weightedScore * 100) / 100,
    });
  }

  // Round finalScore to 2 decimal places
  const finalScore = Math.round(totalWeightedScore * 100) / 100;

  // Match letter grade
  let letterGrade = "E";
  let gradePoint = 0.0;

  for (const gl of practicum.gradeLetters) {
    const min = Number(gl.minScore);
    const max = Number(gl.maxScore);
    if (finalScore >= min && finalScore <= max) {
      letterGrade = gl.letter;
      gradePoint = Number(gl.gradePoint);
      break;
    }
  }

  return {
    studentEnrollmentId: enrollment.id,
    studentId: enrollment.student.id,
    nim: enrollment.student.nim,
    fullName: enrollment.student.fullName,
    className: enrollment.practicumClass.name,
    components: componentsResult,
    finalScore,
    letterGrade,
    gradePoint,
    isPublished: !!enrollment.publishedGrade,
  };
}

/**
 * Calculates entire grading matrix for a practicum or class
 */
export async function getPracticumGradingMatrix(
  practicumId: string,
  classId?: string
) {
  "use cache";
  cacheLife("dashboard_stats");
  cacheTag(
    "practicums",
    `practicum-${practicumId}`,
    `grading-matrix-${practicumId}`,
    classId ? `grades-class-${classId}` : `grades-practicum-${practicumId}`
  );

  const practicum = await prisma.practicum.findUnique({
    where: { id: practicumId },
    include: {
      laboratory: true,
      gradingComponents: { orderBy: { order: "asc" } },
      gradeLetters: { orderBy: { order: "asc" } },
      classes: {
        where: classId ? { id: classId } : undefined,
        include: {
          assistantAssignments: {
            select: { assistantId: true },
          },
          studentEnrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: { select: { id: true, fullName: true, nim: true } },
              grades: true,
              publishedGrade: true,
            },
            orderBy: { student: { nim: "asc" } },
          },
        },
      },
    },
  });

  if (!practicum) throw new Error("Praktikum tidak ditemukan.");

  const allEnrollments = practicum.classes.flatMap((c) =>
    c.studentEnrollments.map((enr) => ({
      ...enr,
      className: c.name,
    }))
  );

  const studentResults: StudentGradeResult[] = [];

  for (const enr of allEnrollments) {
    const calc = await calculateStudentGrade(enr.id);
    studentResults.push(calc);
  }

  return sanitizeData({
    practicum,
    components: practicum.gradingComponents,
    students: studentResults,
  });
}
