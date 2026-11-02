import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { sanitizeData } from "@/lib/serialize";

export async function getUsers(role?: string, search?: string) {
  "use cache";
  cacheLife("dashboard_stats");
  cacheTag("users-list");

  const users = await prisma.user.findMany({
    where: {
      ...(role && { role: role as UserRole }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
          { nim: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    take: 100,
  });

  return sanitizeData(users);
}

export async function getUserProfile(userId: string) {
  "use cache: private";
  cacheLife("dashboard_stats");
  cacheTag(`user-profile-${userId}`, `user-${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return sanitizeData(user);
}
