"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveGradeScoreAction, publishFinalGradesAction } from "@/server/actions/grading.actions";
import { StudentGradeResult } from "@/server/services/grading.service";
import { toast } from "sonner";
import { Send, Search, Loader2, FileSpreadsheet } from "lucide-react";

interface ComponentInfo {
  id: string;
  name: string;
  weight: number | string | { toString(): string };
  isPerSession: boolean;
}

export function InteractiveMatrix({
  practicumId,
  components,
  initialStudents,
  canPublish,
  canEditScores,
}: {
  practicumId: string;
  components: ComponentInfo[];
  initialStudents: StudentGradeResult[];
  canPublish: boolean;
  canEditScores: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [students, setStudents] = React.useState(initialStudents);
  const [prevInitialStudents, setPrevInitialStudents] = React.useState(initialStudents);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);

  if (initialStudents !== prevInitialStudents) {
    setPrevInitialStudents(initialStudents);
    setStudents(initialStudents);
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      (s.nim && s.nim.toLowerCase().includes(q)) ||
      s.className.toLowerCase().includes(q)
    );
  });

  const handleScoreChange = (
    enrollmentId: string,
    componentId: string,
    newScore: number
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentEnrollmentId !== enrollmentId) return s;

        const updatedComps = s.components.map((c) => {
          if (c.componentId !== componentId) return c;
          const weighted = (newScore / c.maxScore) * c.weight * 100;
          return {
            ...c,
            rawScore: newScore,
            weightedScore: Math.round(weighted * 100) / 100,
          };
        });

        const newFinal = updatedComps.reduce((acc, c) => acc + c.weightedScore, 0);
        return {
          ...s,
          components: updatedComps,
          finalScore: Math.round(newFinal * 100) / 100,
        };
      })
    );
  };

  const handleScoreBlur = async (
    enrollmentId: string,
    componentId: string,
    score: number
  ) => {
    const key = `${enrollmentId}_${componentId}`;
    setSavingKey(key);
    try {
      await saveGradeScoreAction({
        studentEnrollmentId: enrollmentId,
        gradingComponentId: componentId,
        score,
        practicumId,
      });
      toast.success("Skor Disimpan", { description: "Nilai komponen terupdate." });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan skor");
    } finally {
      setSavingKey(null);
    }
  };

  const handlePublishAll = async () => {
    if (students.length === 0) return;
    if (!confirm("Apakah Anda yakin ingin mempublikasikan nilai akhir untuk seluruh mahasiswa?")) {
      return;
    }

    setIsPublishing(true);
    try {
      const enrollmentIds = students.map((s) => s.studentEnrollmentId);
      const res = await publishFinalGradesAction({
        practicumId,
        enrollmentIds,
      });

      toast.success("Nilai Akhir Berhasil Dipublikasikan", {
        description: `${res.count} nilai mahasiswa telah disiarkan ke portal praktikan.`,
      });
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal mempublikasikan nilai");
    } finally {
      setIsPublishing(false);
    }
  };

  const getLetterBadge = (letter: string) => {
    switch (letter) {
      case "A":
      case "AB":
        return "present";
      case "B":
      case "BC":
        return "default";
      case "C":
        return "late";
      case "D":
      case "E":
        return "absent";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {/* Spreadsheet Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border/60">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari mahasiswa atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs bg-muted/20 h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Download Excel Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
          >
            <a
              href={`/api/practicums/${practicumId}/export/grades`}
              download
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
              Export .xlsx
            </a>
          </Button>

          {/* Publish Final Grade Button */}
          {canPublish && (
            <Button
              type="button"
              size="sm"
              onClick={handlePublishAll}
              disabled={isPublishing || students.length === 0}
              className="text-xs bg-primary shadow-sm cursor-pointer"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Mempublikasikan...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Publish Final Grade
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Spreadsheet Matrix Table */}
      <div className="rounded-lg border border-border/80 bg-card overflow-x-auto shadow-sm">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 z-20 bg-muted/90">No</TableHead>
              <TableHead className="w-36 sticky left-12 z-20 bg-muted/90">NIM</TableHead>
              <TableHead className="w-56 sticky left-48 z-20 bg-muted/90">Nama Mahasiswa</TableHead>
              <TableHead className="w-28">Kelas</TableHead>

              {components.map((c) => (
                <TableHead key={c.id} className="text-center font-mono text-[11px] min-w-[120px]">
                  <div>{c.name}</div>
                  <div className="text-[10px] text-primary font-normal">
                    {Number(c.weight) * 100}%
                  </div>
                </TableHead>
              ))}

              <TableHead className="text-right font-mono text-[11px] w-28 bg-muted/40">
                Nilai Akhir
              </TableHead>
              <TableHead className="text-center font-mono text-[11px] w-24 bg-muted/40">
                Huruf Mutu
              </TableHead>
              <TableHead className="text-center font-mono text-[11px] w-28">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7 + components.length}
                  className="text-center py-10 text-muted-foreground"
                >
                  Belum ada data praktikan untuk evaluasi nilai.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student, idx) => (
                <TableRow key={student.studentEnrollmentId} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground sticky left-0 bg-card">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-primary sticky left-12 bg-card">
                    {student.nim || "-"}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground sticky left-48 bg-card truncate max-w-[200px]">
                    {student.fullName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {student.className}
                  </TableCell>

                  {/* Component Score Inputs */}
                  {components.map((c) => {
                    const compResult = student.components.find((sc) => sc.componentId === c.id);
                    const currentScore = compResult ? compResult.rawScore : 0;
                    const key = `${student.studentEnrollmentId}_${c.id}`;
                    const isSaving = savingKey === key;

                    return (
                      <TableCell key={c.id} className="text-center p-1.5">
                        {canEditScores ? (
                          <div className="relative inline-block w-20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={currentScore}
                              onChange={(e) =>
                                handleScoreChange(
                                  student.studentEnrollmentId,
                                  c.id,
                                  Number(e.target.value) || 0
                                )
                              }
                              onBlur={(e) =>
                                handleScoreBlur(
                                  student.studentEnrollmentId,
                                  c.id,
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8 w-full rounded border border-border/80 bg-background px-2 text-center font-mono text-xs font-semibold focus:border-primary focus:outline-none"
                            />
                            {isSaving && (
                              <Loader2 className="absolute right-1 top-2.5 h-3 w-3 animate-spin text-primary" />
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-semibold">
                            {currentScore}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}

                  {/* Calculated Final Score */}
                  <TableCell className="text-right font-mono font-bold text-sm text-foreground bg-muted/20">
                    {student.finalScore.toFixed(2)}
                  </TableCell>

                  {/* Letter Grade */}
                  <TableCell className="text-center font-mono bg-muted/20">
                    <Badge variant={getLetterBadge(student.letterGrade)} className="font-bold text-xs">
                      {student.letterGrade}
                    </Badge>
                  </TableCell>

                  {/* Publication Status */}
                  <TableCell className="text-center">
                    <Badge
                      variant={student.isPublished ? "present" : "secondary"}
                      className="text-[10px]"
                    >
                      {student.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
