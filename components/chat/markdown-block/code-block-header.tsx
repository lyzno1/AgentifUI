"use client";

import React from "react";
import { cn } from "@lib/utils";
import { CodeIcon } from "lucide-react";
import { CopyButton } from "./copy-button";
import { ExportButton } from "./export-button";

interface CodeBlockHeaderProps {
  language: string | null;
  className?: string;
  codeContent?: string; // 代码内容属性用于复制功能
}

// 使用 React.memo 包装组件，防止不必要的重新渲染

// 使用 React.memo 包装组件，防止不必要的重新渲染
export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = React.memo(({
  language,
  className,
  codeContent,
}) => {
  // 注意：复制功能已移至CopyButton组件中
  
  // 注意：这个组件只处理头部UI和复制功能，不影响代码高亮

  if (!language) {
    return null; // Don't render header if language is not specified
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1 rounded-t-lg transform-gpu border-b", // 降低头部高度
        className
      )}
      style={{
        backgroundColor: 'var(--md-code-header-bg)',
        borderColor: 'var(--md-code-header-border)',
        color: 'var(--md-code-header-text)'
      }}
    >
      <div className="flex items-center gap-1.5">
        <CodeIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium select-none tracking-wide">
          {language.charAt(0).toUpperCase() + language.slice(1)}
        </span>
      </div>
      
      {/* --- BEGIN COMMENT ---
      🎯 按钮组：导出按钮在左，复制按钮在右
      使用flex布局，间距适中，保持视觉平衡
      --- END COMMENT --- */}
      {codeContent && (
        <div className="flex items-center gap-1">
          {/* 导出按钮 */}
          <ExportButton 
            content={codeContent}
            language={language}
            tooltipPlacement="bottom" 
          />
          
          {/* 复制按钮 */}
          <CopyButton 
            content={codeContent} 
            tooltipPlacement="bottom" 
          />
        </div>
      )}
    </div>
  );
});
