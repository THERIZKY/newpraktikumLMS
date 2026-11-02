"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Bell,
  BookOpen,
  Building2,
  FileCheck2,
  GraduationCap,
  Megaphone,
  User,
  History,
  Settings,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

interface DashboardHeaderProps {
  user: {
    fullName: string;
    role: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openCommand, setOpenCommand] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);

  // Keyboard shortcut ⌘K / Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setOpenCommand((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const nextDark = !html.classList.contains("dark");
    html.classList.toggle("dark", nextDark);
    setIsDark(nextDark);
  };

  // Compute dynamic breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);

  const getBreadcrumbTitle = (segment: string) => {
    switch (segment) {
      case "dashboard":
        return "Dashboard";
      case "laboratories":
        return "Laboratorium";
      case "practicums":
        return "Katalog Praktikum";
      case "classes":
        return "Kelas & Shift";
      case "sessions":
        return "Sesi Pertemuan";
      case "submissions":
        return "Tugas & Submission";
      case "grades":
        return "Nilai & Transkrip";
      case "announcements":
        return "Pusat Pengumuman";
      case "notifications":
        return "Notifikasi";
      case "users":
        return "Kelola Pengguna";
      case "audit-log":
        return "Audit Log";
      case "settings":
        return "Pengaturan Sistem";
      case "profile":
        return "Profil Akun";
      default:
        // UUID or specific id truncated
        if (segment.length > 10) return `${segment.slice(0, 8)}...`;
        return segment;
    }
  };

  const handleNavigate = (path: string) => {
    setOpenCommand(false);
    router.push(path);
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-4 sm:px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="h-4 w-[1px] bg-border" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-xs font-label">
                  <Link href="/dashboard">LMS</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathSegments.map((segment, idx) => {
                const href = `/${pathSegments.slice(0, idx + 1).join("/")}`;
                const isLast = idx === pathSegments.length - 1;
                return (
                  <React.Fragment key={href}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="text-xs font-semibold text-primary">
                          {getBreadcrumbTitle(segment)}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="text-xs">
                          <Link href={href}>{getBreadcrumbTitle(segment)}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Stitch Semester Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-low border border-secondary/30 font-mono text-[11px] text-secondary shadow-[0_0_10px_rgba(0,240,255,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_#00f0ff]" />
            <span>TA 2026/2027 Genap</span>
          </div>

          {/* Quick Search ⌘K Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenCommand(true)}
            className="hidden sm:flex items-center gap-2 h-8 px-2.5 text-xs text-muted-foreground bg-surface-low border-border hover:border-secondary/50 hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5 text-secondary" />
            <span className="font-sans">Cari modul, kelas, mahasiswa...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-secondary opacity-100">
              ⌘K
            </kbd>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={toggleTheme}
            className="rounded border border-border/60 bg-surface-low text-muted-foreground hover:text-primary"
            title="Toggle Neon Tokyo / Light Mode"
          >
            {isDark ? <Moon className="h-4 w-4 text-secondary" /> : <Sun className="h-4 w-4 text-amber-500" />}
          </Button>

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                className="relative rounded border border-border/60 bg-surface-low hover:bg-muted"
                title="Notifikasi"
              >
                <Bell className="h-4 w-4 text-foreground" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-mono font-bold text-white shadow-[0_0_6px_#ff2d78]">
                  3
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 border border-border shadow-xl">
              <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Notifikasi Terbaru</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  3 Baru
                </Badge>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/40 text-xs">
                <div className="p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="font-semibold text-primary">Tugas Baru</span>
                    <span>10m lalu</span>
                  </div>
                  <p className="font-medium text-foreground">
                    Modul 04: REST API Backend telah dibuka
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Praktikum Rekayasa Perangkat Lunak
                  </p>
                </div>

                <div className="p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="font-semibold text-secondary">Nilai Publikasi</span>
                    <span>2j lalu</span>
                  </div>
                  <p className="font-medium text-foreground">
                    Nilai Sesi 03 telah diverifikasi oleh Asisten
                  </p>
                </div>

                <div className="p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="font-semibold text-neon-yellow">Pengumuman Lab</span>
                    <span>1h lalu</span>
                  </div>
                  <p className="font-medium text-foreground">
                    Jadwal Responsi Akhir Semester Genap 2026
                  </p>
                </div>
              </div>

              <div className="p-2 border-t border-border/50 bg-muted/10 text-center">
                <Link
                  href="/notifications"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Lihat Semua Notifikasi
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* ⌘K Command Dialog */}
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Ketik perintah atau cari modul praktikum..." />
        <CommandList>
          <CommandEmpty>Hasil tidak ditemukan.</CommandEmpty>

          <CommandGroup heading="Navigasi Cepat">
            <CommandItem onSelect={() => handleNavigate("/dashboard")}>
              <Sparkles className="mr-2 h-4 w-4 text-neon-yellow" />
              <span>Dashboard Utama</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/practicums")}>
              <BookOpen className="mr-2 h-4 w-4 text-primary" />
              <span>Katalog Praktikum</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/laboratories")}>
              <Building2 className="mr-2 h-4 w-4 text-emerald-400" />
              <span>Laboratorium</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/submissions")}>
              <FileCheck2 className="mr-2 h-4 w-4 text-neon-cyan" />
              <span>Tugas & Pengumpulan Versi</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/grades")}>
              <GraduationCap className="mr-2 h-4 w-4 text-amber-400" />
              <span>Nilai & Spreadsheet Matrix</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Komunikasi & Log">
            <CommandItem onSelect={() => handleNavigate("/announcements")}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>Pusat Pengumuman</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/notifications")}>
              <Bell className="mr-2 h-4 w-4" />
              <span>Inbox Notifikasi</span>
            </CommandItem>
            {user.role === "SYSTEM_ADMIN" && (
              <>
                <CommandItem onSelect={() => handleNavigate("/users")}>
                  <User className="mr-2 h-4 w-4 text-primary" />
                  <span>Kelola Akun Pengguna</span>
                </CommandItem>
                <CommandItem onSelect={() => handleNavigate("/audit-log")}>
                  <History className="mr-2 h-4 w-4 text-rose-400" />
                  <span>Audit Log Sistem</span>
                </CommandItem>
                <CommandItem onSelect={() => handleNavigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan Sistem</span>
                </CommandItem>
              </>
            )}
            <CommandItem onSelect={() => handleNavigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil Akun Saya ({user.fullName})</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
