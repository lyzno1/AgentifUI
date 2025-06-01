"use client";

import React from "react";
import { cn } from "@lib/utils";
import { FiDownload, FiCheck } from "react-icons/fi";
import { TooltipWrapper } from "@components/ui/tooltip-wrapper";

interface ExportButtonProps {
  content?: string;
  language?: string;
  className?: string;
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
  onExport?: () => void;
}

// 使用随机ID生成器确保每个导出按钮的tooltip是唯一的
const generateUniqueId = () => `export-btn-${Math.random().toString(36).substring(2, 11)}`;

// 🎯 根据编程语言获取合适的文件扩展名
const getFileExtension = (language: string): string => {
  const extensionMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'py',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    bash: 'sh',
    shell: 'sh',
    sql: 'sql',
    json: 'json',
    yaml: 'yml',
    yml: 'yml',
    markdown: 'md',
    html: 'html',
    css: 'css',
    scss: 'scss',
    php: 'php',
    ruby: 'rb',
    swift: 'swift',
    kotlin: 'kt',
    dart: 'dart',
    r: 'r',
    matlab: 'm',
    xml: 'xml'
  };
  
  return extensionMap[language.toLowerCase()] || 'txt';
};

// 🎯 生成合适的文件名
const generateFileName = (language: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const extension = getFileExtension(language);
  return `code_${timestamp}.${extension}`;
};

/**
 * 通用导出按钮组件
 * 适用于代码块等需要导出功能的地方
 * 符合应用的石色主题，在亮色和暗色模式下都有良好的视觉效果
 * 样式和交互逻辑参考CopyButton组件
 */
export const ExportButton: React.FC<ExportButtonProps> = React.memo(({
  content,
  language = 'text',
  className,
  tooltipPlacement = "bottom",
  onExport
}) => {
  // 导出功能状态
  const [isExported, setIsExported] = React.useState(false);
  
  // 为每个导出按钮生成唯一的tooltip ID
  const tooltipId = React.useRef(generateUniqueId()).current;
  
  // 处理导出操作
  const handleExport = React.useCallback(async () => {
    if (!content) return;
    
    try {
      // 🎯 创建Blob对象并触发下载
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // 创建临时下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName(language);
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // 设置成功状态
      setIsExported(true);
      
      // 调用外部传入的onExport回调（如果有）
      if (onExport) {
        onExport();
      }
      
      console.log('[ExportButton] 代码导出成功:', {
        language,
        fileName: generateFileName(language),
        contentLength: content.length
      });
      
      // 2秒后重置状态
      setTimeout(() => {
        setIsExported(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to export content:", error);
    }
  }, [content, language, onExport]);

  if (!content) return null;

  return (
    <TooltipWrapper
      content="导出文件"
      id={tooltipId}
      placement={tooltipPlacement}
      desktopOnly={true}
    >
      <button
        onClick={handleExport}
        className={cn(
          "flex items-center justify-center p-1.5 rounded-md",
          // 🎯 基础文本颜色 - 符合石色主题，与CopyButton保持一致
          "text-stone-500 dark:text-stone-400", 
          // 🎯 悬停文本颜色 - 亮色模式变深，暗色模式变亮
          "hover:text-stone-700 dark:hover:text-stone-300",
          // 🎯 悬停背景色 - 使用半透明的中间色调，适合亮暗两种模式
          "hover:bg-stone-300/40 dark:hover:bg-stone-600/40",
          "focus:outline-none",
          className
        )}
        style={{ transform: 'translateZ(0)' }} // 添加硬件加速，减少闪烁
        aria-label="导出文件"
      >
        {isExported ? (
          <FiCheck className="w-4 h-4" />
        ) : (
          <FiDownload className="w-4 h-4" />
        )}
      </button>
    </TooltipWrapper>
  );
});

// 显示名称，方便调试
ExportButton.displayName = "ExportButton"; 