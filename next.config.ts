import type { NextConfig } from "next";

// --- BEGIN COMMENT ---
// 配置 Next.js，移除自定义 webpack 配置，使用环境变量控制组件
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
  
  // 移除了 webpack 配置，现在用环境变量控制组件
};

export default nextConfig;
