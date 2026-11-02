import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      nim?: string | null;
      username: string;
      fullName: string;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    nim?: string | null;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    nim?: string | null;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
  }
}
