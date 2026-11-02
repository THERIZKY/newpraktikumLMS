import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/server/queries/admin.queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";
import { saveSystemSettingAction } from "@/server/actions/settings.actions";

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

async function SettingsContent() {
  await connection();
  const session = await auth();

  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getSystemSettings();

  async function updateSettingForm(formData: FormData) {
    "use server";
    const key = formData.get("key") as string;
    const value = formData.get("value") as string;
    const description = formData.get("description") as string;

    await saveSystemSettingAction({ key, value, description });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground font-mono">
          {settings.length} Parameter Global
        </span>
      </div>

      {settings.map((setting) => (
        <Card key={setting.id} className="p-4">
          <form action={updateSettingForm} className="space-y-3">
            <input type="hidden" name="key" value={setting.key} />
            <input type="hidden" name="description" value={setting.description || ""} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {setting.key}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {setting.description || "Parameter konfigurasi inti LMS."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {setting.key === "SEMESTER_CURRENT" ? (
                  <select
                    name="value"
                    defaultValue={
                      setting.value === "ODD" || setting.value === "GANJIL"
                        ? "GANJIL"
                        : "GENAP"
                    }
                    className="h-8 font-mono text-xs w-36 rounded border border-border bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="GANJIL">Ganjil</option>
                    <option value="GENAP">Genap</option>
                  </select>
                ) : (
                  <Input
                    name="value"
                    defaultValue={setting.value}
                    className="h-8 font-mono text-xs max-w-xs bg-muted/20"
                    required
                  />
                )}
                <Button type="submit" size="sm" variant="outline" className="text-xs h-8">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Simpan
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] font-mono">
            CONFIGURATION MATRIX
          </Badge>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
          Pengaturan Sistem Global
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Konfigurasi tahun akademik aktif, batas ukuran berkas, kebijakan keterlambatan, dan parameter sistem.
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
