"use client"

import React, { useState, memo } from 'react';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { Provider } from '@lib/types/database';

interface InstanceFilterSelectorProps {
  providers: Provider[];
  selectedProviderId: string | null; // null表示"全部"
  onFilterChange: (providerId: string | null) => void;
  instanceCount: number;
  className?: string;
  isLoading?: boolean; // 新增loading状态
}

export const InstanceFilterSelector = memo(function InstanceFilterSelector({ 
  providers, 
  selectedProviderId, 
  onFilterChange, 
  instanceCount,
  className,
  isLoading = false
}: InstanceFilterSelectorProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // --- BEGIN COMMENT ---
  // 获取当前选中的提供商信息
  // --- END COMMENT ---
  const selectedProvider = selectedProviderId ? providers.find(p => p.id === selectedProviderId) : null;

  // --- BEGIN COMMENT ---
  // 处理筛选选择
  // --- END COMMENT ---
  const handleFilterSelect = (providerId: string | null) => {
    onFilterChange(providerId);
    setIsOpen(false);
  };



  return (
    <div className={cn("relative", className)}>
      {/* --- BEGIN COMMENT ---
      主标题按钮：模仿conversation-title-button的样式
      --- END COMMENT --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 transition-all duration-200 ease-in-out",
          "cursor-pointer group"
        )}
      >
        <div className="flex items-center gap-2">
          <h2 className={cn(
            "font-bold text-sm font-serif",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            {selectedProvider ? `${selectedProvider.name}应用` : '全部应用'}
          </h2>
        </div>
        
        <div className={cn(
          "flex-shrink-0 w-3 h-3 flex items-center justify-center transition-transform duration-200",
          !isLoading && "group-hover:scale-110",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </div>
      </button>

      {/* --- BEGIN COMMENT ---
      实例数量显示
      --- END COMMENT --- */}
      <div className={cn(
        "text-xs font-serif mt-1",
        isDark ? "text-stone-400" : "text-stone-600"
      )}>
        共 {instanceCount} 个
      </div>

      {/* --- BEGIN COMMENT ---
      下拉菜单：完全模仿conversation-title-button的样式
      --- END COMMENT --- */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉选项 */}
          <div className={cn(
            "absolute top-full left-0 mt-1 min-w-[10rem] z-[95]",
            "rounded-md shadow-lg overflow-hidden border",
            isDark 
              ? "bg-stone-700/95 border-stone-600/80 backdrop-blur-sm" 
              : "bg-stone-50/95 border-stone-300/80 backdrop-blur-sm"
          )}>
            {/* 全部选项 */}
            <button
              onClick={() => handleFilterSelect(null)}
              className={cn(
                "w-full text-left px-4 py-3 text-sm font-serif",
                "transition-colors duration-150",
                "flex items-center justify-between gap-2",
                "cursor-pointer",
                !selectedProviderId
                  ? isDark
                    ? "bg-stone-600/60 text-stone-200"
                    : "bg-stone-200/60 text-stone-800"
                  : isDark
                    ? "hover:bg-stone-600/40 text-stone-300"
                    : "hover:bg-stone-200/40 text-stone-700"
              )}
            >
              <span>全部应用</span>
              
              {!selectedProviderId && (
                <Check className="w-4 h-4 flex-shrink-0" />
              )}
            </button>
            
            {/* 分隔线 */}
            <div className={cn(
              "h-px mx-2",
              isDark ? "bg-stone-600/50" : "bg-stone-300/50"
            )} />
            
            {/* 提供商选项 */}
            {providers.filter(p => p.is_active).map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleFilterSelect(provider.id)}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm font-serif",
                  "transition-colors duration-150",
                  "flex items-center justify-between gap-2",
                  "cursor-pointer",
                  selectedProviderId === provider.id
                    ? isDark
                      ? "bg-stone-600/60 text-stone-200"
                      : "bg-stone-200/60 text-stone-800"
                    : isDark
                      ? "hover:bg-stone-600/40 text-stone-300"
                      : "hover:bg-stone-200/40 text-stone-700"
                )}
              >
                <span className="truncate">{provider.name}</span>
                
                {selectedProviderId === provider.id && (
                  <Check className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
            ))}
            
            {/* --- BEGIN COMMENT ---
            如果没有活跃的提供商，显示提示信息
            --- END COMMENT --- */}
            {providers.filter(p => p.is_active).length === 0 && (
              <div className={cn(
                "px-4 py-3 text-sm font-serif text-center",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                暂无可用的服务提供商
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}); 