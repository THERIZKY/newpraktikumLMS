import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  cacheLife: {
    // Profil durasi cache khusus domain LMS Praktikum
    semester_static: {
      stale: 60 * 30, // 30 menit di client router cache
      revalidate: 60 * 60 * 24, // 24 jam background revalidation di server
      expire: 60 * 60 * 24 * 30, // 30 hari maksimal
    },
    practicum_catalog: {
      stale: 60 * 5, // 5 menit di client cache (navigasi instan)
      revalidate: 60 * 60, // 1 jam di server
      expire: 60 * 60 * 24, // 24 jam maksimal
    },
    session_schedule: {
      stale: 60 * 2, // 2 menit di client cache
      revalidate: 60 * 15, // 15 menit di server
      expire: 60 * 60 * 4, // 4 jam maksimal
    },
    dashboard_stats: {
      stale: 60, // 1 menit di client cache
      revalidate: 60 * 5, // 5 menit di server
      expire: 60 * 30, // 30 menit maksimal
    },
  },
};

export default nextConfig;
