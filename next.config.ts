import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SQLite 네이티브 모듈은 서버사이드에서만 사용
  serverExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3'],
};

export default nextConfig;
