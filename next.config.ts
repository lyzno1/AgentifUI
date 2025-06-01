import type { NextConfig } from "next";

// --- BEGIN COMMENT ---
// 配置 Next.js，使用传统 webpack 避免 Turbopack 字体加载问题
// --- END COMMENT ---

const nextConfig: NextConfig = {
  /* config options here */
  
  // 生产环境自动移除 console.log
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'] // 保留 console.error 和 console.warn
    } : false
  },
  
  // 在构建时忽略 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 在构建时忽略 TypeScript 错误（可选）
  typescript: {
    ignoreBuildErrors: false, // 设为 true 可同时忽略 TS 错误
  },
  
  // 使用传统 webpack，字体加载正常
};

export default nextConfig;
