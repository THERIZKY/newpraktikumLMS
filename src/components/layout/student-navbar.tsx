"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Terminal,
  LayoutDashboard,
  FileCheck2,
  GraduationCap,
  CalendarDays,
  Megaphone,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Menu,
  Sparkles,
} from "lucide-react";

interface StudentNavbarProps {
  user: {
    id: string;
    fullName: string;
    username: string;
    role: string;
    nim?: string | null;
  };
}

const studentNavLinks = [
  {
    title: "Beranda Praktikum",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tugas & Pengumpulan",
    href: "/submissions",
    icon: FileCheck2,
  },
  {
    title: "Nilai & Transkrip",
    href: "/grades",
    icon: GraduationCap,
  },
  {
    title: "Jadwal Sesi",
    href: "/practicums",
    icon: CalendarDays,
  },
  {
    title: "Pengumuman",
    href: "/announcements",
    icon: Megaphone,
  },
];

export function StudentNavbar({ user }: StudentNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openCommand, setOpenCommand] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);

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

  const handleNavigate = (path: string) => {
    setOpenCommand(false);
    setMobileMenuOpen(false);
    router.push(path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 w-full border-b border-primary/25 bg-card/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
        {/* Left: Brand Identity & Horizontal Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/50 flex items-center justify-center shadow-[0_0_12px_rgba(255,45,120,0.3)] group-hover:border-secondary transition-colors">
              <Terminal className="h-4 w-4 text-primary group-hover:text-secondary transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm tracking-tight text-foreground leading-none">
                LMS PRAKTIKUM
              </span>
              <span className="font-mono text-[10px] text-secondary tracking-widest uppercase mt-1 leading-none">
                PORTAL PRAKTIKAN // CYBER-SYS
              </span>
            </div>
          </Link>

          <div className="hidden lg:block h-6 w-px bg-border mx-1" />

          {/* Top Horizontal Nav Links (No Left Sidebar for Praktikan) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-label">
            {studentNavLinks.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-2 rounded-md transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary/15 text-primary border-b-2 border-primary font-semibold shadow-[0_0_12px_rgba(255,45,120,0.2)]"
                      : "text-muted-foreground hover:text-secondary hover:bg-muted/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Quick Search (⌘K), Theme, Notifications & Student Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenCommand(true)}
            className="hidden md:flex items-center justify-between gap-3 px-3 h-8 rounded-md bg-surface-low border-border text-muted-foreground hover:border-secondary/60 hover:text-foreground transition-all text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-secondary" />
              <span>Cari modul, materi...</span>
            </div>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-secondary border border-secondary/30">
              ⌘K
            </kbd>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={toggleTheme}
            className="rounded-md bg-surface-low border border-border text-muted-foreground hover:text-secondary hover:border-secondary/50"
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
                className="relative rounded-md bg-surface-low border border-border text-muted-foreground hover:text-primary hover:border-primary/50"
                title="Notifikasi Praktikum"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#ff2d78] animate-pulse" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 border border-border shadow-xl">
              <div className="flex items-center justify-between p-3 border-b border-border/60 bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Notifikasi Praktikan</span>
                </div>
                <Badge variant="neonPink" className="text-[10px] font-mono">
                  Aktif
                </Badge>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border/40 text-xs">
                <div className="p-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="font-semibold text-primary">Tenggat Laporan</span>
                    <span>Minggu Ini</span>
                  </div>
                  <p className="font-medium text-foreground">
                    Periksa batas waktu pengumpulan laporan modul aktif
                  </p>
                </div>
                <div className="p-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="font-semibold text-secondary">Sinkronisasi Nilai</span>
                    <span>Terbaru</span>
                  </div>
                  <p className="font-medium text-foreground">
                    Transkrip komponen nilai praktikum telah diperbarui
                  </p>
                </div>
              </div>
              <div className="p-2 border-t border-border/50 bg-muted/10 text-center">
                <Link
                  href="/notifications"
                  className="text-xs text-secondary hover:underline font-medium"
                >
                  Lihat Semua Notifikasi
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Student Profile Pill */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2.5 border-l border-border">
            <Link href="/profile" className="flex items-center gap-2.5 group">
              <div className="flex flex-col text-right">
                <span className="font-headline text-xs font-semibold text-foreground leading-none group-hover:text-primary transition-colors">
                  {user.fullName}
                </span>
                <span className="font-mono text-[10px] text-secondary mt-1 leading-none">
                  NIM: {user.nim || user.username}
                </span>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-secondary/60 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                <AvatarFallback className="bg-primary/20 text-primary font-mono text-xs font-bold">
                  {user.fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Keluar / Logout"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Navigation Drawer */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                className="lg:hidden rounded-md border border-border"
                aria-label="Buka Menu Navigasi"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col justify-between">
              <div>
                <SheetHeader className="p-4 border-b border-border text-left">
                  <SheetTitle className="text-sm font-bold flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    Portal Praktikan
                  </SheetTitle>
                </SheetHeader>
                <div className="p-3 space-y-1">
                  {studentNavLinks.map((item) => {
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => handleNavigate(item.href)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-primary/15 text-primary border-l-2 border-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-border space-y-3">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {user.fullName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] font-mono text-secondary truncate">
                      NIM: {user.nim || user.username}
                    </div>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-xs text-destructive hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Keluar dari Portal
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ⌘K Command Dialog */}
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Cari modul sesi, tugas praktikum, atau halaman..." />
        <CommandList>
          <CommandEmpty>Hasil tidak ditemukan.</CommandEmpty>
          <CommandGroup heading="Navigasi Portal Praktikan">
            <CommandItem onSelect={() => handleNavigate("/dashboard")}>
              <Sparkles className="mr-2 h-4 w-4 text-neon-yellow" />
              <span>Beranda Praktikum</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/submissions")}>
              <FileCheck2 className="mr-2 h-4 w-4 text-primary" />
              <span>Tugas & Pengumpulan (Multi-Version)</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/grades")}>
              <GraduationCap className="mr-2 h-4 w-4 text-secondary" />
              <span>Nilai & Transkrip Akademik</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/practicums")}>
              <CalendarDays className="mr-2 h-4 w-4 text-neon-purple" />
              <span>Jadwal Sesi & Katalog Praktikum</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Informasi & Akun">
            <CommandItem onSelect={() => handleNavigate("/announcements")}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>Pengumuman Laboratorium</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/notifications")}>
              <Bell className="mr-2 h-4 w-4" />
              <span>Kotak Masuk Notifikasi</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil Praktikan ({user.fullName})</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
