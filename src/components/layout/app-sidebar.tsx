"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  FileCheck2,
  GraduationCap,
  Bell,
  Megaphone,
  Users,
  History,
  Settings,
  LogOut,
  Terminal,
} from "lucide-react";
import { UserRole } from "@prisma/client";

interface AppSidebarProps {
  user: {
    id: string;
    role: UserRole;
    fullName: string;
    username: string;
    nim?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { open } = useSidebar();

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "SYSTEM_ADMIN":
        return "neonPink";
      case "LAB_ADMIN":
        return "default";
      case "ASSISTANT":
        return "neonCyan";
      case "STUDENT":
        return "present";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "SYSTEM_ADMIN":
        return "SYS ADMIN";
      case "LAB_ADMIN":
        return "LAB ADMIN";
      case "ASSISTANT":
        return "ASISTEN";
      case "STUDENT":
        return "PRAKTIKAN";
      default:
        return role;
    }
  };

  // Menu items filtered by role
  const mainNav = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Laboratorium",
      href: "/laboratories",
      icon: Building2,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN"],
    },
    {
      title: "Katalog Praktikum",
      href: "/practicums",
      icon: BookOpen,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Tugas & Submission",
      href: "/submissions",
      icon: FileCheck2,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Nilai & Transkrip",
      href: "/grades",
      icon: GraduationCap,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
  ];

  const adminNav = [
    {
      title: "Pusat Pengumuman",
      href: "/announcements",
      icon: Megaphone,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Notifikasi",
      href: "/notifications",
      icon: Bell,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Kelola Pengguna",
      href: "/users",
      icon: Users,
      roles: ["SYSTEM_ADMIN"],
    },
    {
      title: "Audit Log",
      href: "/audit-log",
      icon: History,
      roles: ["SYSTEM_ADMIN"],
    },
    {
      title: "Pengaturan Sistem",
      href: "/settings",
      icon: Settings,
      roles: ["SYSTEM_ADMIN"],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
            <Terminal className="h-4 w-4" />
          </div>
          {open && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-sans text-xs font-bold tracking-tight text-foreground truncate">
                LMS PRAKTIKUM
              </span>
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest truncate">
                Academic Console
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav
                .filter((item) => item.roles.includes(user.role))
                .map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} title={item.title}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4 shrink-0" />
                          {open && <span className="truncate">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration & System */}
        <SidebarGroup>
          <SidebarGroupLabel>Administrasi & Sistem</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav
                .filter((item) => item.roles.includes(user.role))
                .map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} title={item.title}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4 shrink-0" />
                          {open && <span className="truncate">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 overflow-hidden">
          <Link href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                {user.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {open && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">
                  {user.fullName}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-[9px] px-1 py-0">
                    {getRoleLabel(user.role)}
                  </Badge>
                  {user.nim && (
                    <span className="text-[10px] text-muted-foreground font-mono truncate">
                      {user.nim}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Keluar / Logout"
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive cursor-pointer transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
