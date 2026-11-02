"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Terminal, Shield, Sparkles, Key, User, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Harap isi NIM / Username dan Password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Autentikasi Gagal", {
          description: "Kombinasi kredensial tidak cocok atau akun tidak aktif.",
        });
      } else {
        toast.success("Login Berhasil", {
          description: "Selamat datang kembali di LMS Praktikum.",
        });
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat proses login.");
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (demoId: string, demoPass: string) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    toast.info(`Akun demo ${demoId} dimuat`);
  };

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-neon-pink to-neon-cyan" />

      <CardHeader className="space-y-2 text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary shadow-sm">
          <Terminal className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground font-sans">
          LMS Praktikum
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Sistem Manajemen Praktikum Terpadu & Laboratorium Akademik
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-primary" />
              NIM / Username / Email
            </Label>
            <Input
              id="identifier"
              type="text"
              placeholder="Contoh: 21120120140001 atau admin"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
              required
              className="bg-muted/30 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-xs">
                <Key className="h-3.5 w-3.5 text-primary" />
                Password
              </Label>
              <span className="text-[11px] text-muted-foreground hover:text-primary cursor-pointer">
                Lupa Password?
              </span>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="bg-muted/30 font-mono text-xs"
            />
          </div>

          <Button
            type="submit"
            className="w-full font-medium shadow-md transition-all mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Masuk ke Console
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Demo Selector for 4 Roles */}
        <div className="mt-6 pt-5 border-t border-border/50">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono text-muted-foreground uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-neon-yellow" />
              Akses Cepat Demo Akun:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setDemoAccount("sysadmin", "password123")}
              className="flex items-center justify-start gap-1.5 p-2 rounded border border-border/60 bg-muted/30 hover:bg-muted text-left transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 text-neon-pink" />
              <div>
                <div className="font-semibold text-foreground">System Admin</div>
                <div className="text-[10px] text-muted-foreground font-mono">sysadmin</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount("labadmin", "password123")}
              className="flex items-center justify-start gap-1.5 p-2 rounded border border-border/60 bg-muted/30 hover:bg-muted text-left transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <div>
                <div className="font-semibold text-foreground">Lab Admin</div>
                <div className="text-[10px] text-muted-foreground font-mono">labadmin</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount("asprak1", "password123")}
              className="flex items-center justify-start gap-1.5 p-2 rounded border border-border/60 bg-muted/30 hover:bg-muted text-left transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 text-neon-cyan" />
              <div>
                <div className="font-semibold text-foreground">Asisten</div>
                <div className="text-[10px] text-muted-foreground font-mono">asprak1</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount("21120120140001", "password123")}
              className="flex items-center justify-start gap-1.5 p-2 rounded border border-border/60 bg-muted/30 hover:bg-muted text-left transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <div>
                <div className="font-semibold text-foreground">Praktikan</div>
                <div className="text-[10px] text-muted-foreground font-mono">21120120140001</div>
              </div>
            </button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center text-[11px] text-muted-foreground border-t border-border/40 py-3 bg-muted/10 font-mono">
        Secured with Auth.js v5 • Next.js 16 Edition
      </CardFooter>
    </Card>
  );
}
