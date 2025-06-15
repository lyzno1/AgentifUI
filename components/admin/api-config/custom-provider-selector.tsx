"use client"

import React, { useState } from 'react';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Provider } from '@lib/types/database';

interface CustomProviderSelectorProps {
  providers: Provider[];
  selectedProviderId: string;
  onProviderChange: (providerId: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function CustomProviderSelector({ 
  providers, 
  selectedProviderId, 
  onProviderChange, 
  placeholder = "请选择提供商",
  className,
  error
}: CustomProviderSelectorProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // --- BEGIN COMMENT ---
  // 获取当前选中的提供商信息
  // --- END COMMENT ---
  const selectedProvider = selectedProviderId ? providers.find(p => p.id === selectedProviderId) : null;

  // --- BEGIN COMMENT ---
  // 处理提供商选择
  // --- END COMMENT ---
  const handleProviderSelect = (providerId: string) => {
    onProviderChange(providerId);
    setIsOpen(false);
  };

  // --- BEGIN COMMENT ---
  // 过滤活跃的提供商
  // --- END COMMENT ---
  const activeProviders = providers.filter(p => p.is_active);

  return (
    <div className={cn("relative", className)}>
      {/* --- BEGIN COMMENT ---
      主选择按钮：响应式设计
      --- END COMMENT --- */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm font-serif",
          "border rounded-md transition-all duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          // 基础样式
          isDark 
            ? "bg-stone-700 border-stone-600 text-stone-200" 
            : "bg-white border-stone-300 text-stone-700",
          // 悬停样式
          isDark
            ? "hover:bg-stone-600 hover:border-stone-500"
            : "hover:bg-stone-50 hover:border-stone-400",
          // 焦点样式
          isDark
            ? "focus:ring-stone-500 focus:border-stone-500"
            : "focus:ring-stone-400 focus:border-stone-400",
          // 错误样式
          error && "border-red-500 focus:ring-red-500",
          // 响应式间距
          "sm:px-4 sm:py-2.5"
        )}
      >
        <span className={cn(
          "truncate",
          !selectedProvider && (isDark ? "text-stone-400" : "text-stone-500")
        )}>
          {selectedProvider ? selectedProvider.name : placeholder}
        </span>
        
        <div className={cn(
          "flex-shrink-0 ml-2 transition-transform duration-200",
          isOpen && "rotate-180",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      {/* --- BEGIN COMMENT ---
      错误信息显示
      --- END COMMENT --- */}
      {error && (
        <p className="text-sm text-red-600 mt-1 font-serif">{error}</p>
      )}

      {/* --- BEGIN COMMENT ---
      下拉选项菜单：响应式设计
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
            "absolute top-full left-0 right-0 mt-1 z-[95]",
            "rounded-md shadow-lg overflow-hidden border",
            "max-h-60 overflow-y-auto", // 限制高度并允许滚动
            // 主题样式
            isDark 
              ? "bg-stone-700/95 border-stone-600/80 backdrop-blur-sm" 
              : "bg-white/95 border-stone-300/80 backdrop-blur-sm",
            // 响应式宽度
            "min-w-full"
          )}>
            {/* 空选项（如果需要） */}
            {!selectedProviderId && (
              <button
                onClick={() => handleProviderSelect('')}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm font-serif",
                  "transition-colors duration-150",
                  "flex items-center justify-between gap-2",
                  "cursor-pointer",
                  // 响应式间距
                  "sm:px-4 sm:py-3",
                  isDark
                    ? "hover:bg-stone-600/40 text-stone-400"
                    : "hover:bg-stone-100/60 text-stone-500"
                )}
              >
                <span>{placeholder}</span>
              </button>
            )}
            
            {/* 提供商选项 */}
            {activeProviders.length > 0 ? (
              activeProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-serif",
                    "transition-colors duration-150",
                    "flex items-center justify-between gap-2",
                    "cursor-pointer",
                    // 响应式间距
                    "sm:px-4 sm:py-3",
                    // 选中状态
                    selectedProviderId === provider.id
                      ? isDark
                        ? "bg-stone-600/60 text-stone-200"
                        : "bg-stone-100/80 text-stone-800"
                      : isDark
                        ? "hover:bg-stone-600/40 text-stone-300"
                        : "hover:bg-stone-100/60 text-stone-700"
                  )}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{provider.name}</span>
                      {provider.is_default && (
                        <span className={cn(
                          "px-1.5 py-0.5 text-xs rounded font-serif",
                          isDark
                            ? "bg-stone-500/50 text-stone-200"
                            : "bg-stone-200 text-stone-800"
                        )}>
                          默认
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs truncate",
                      isDark ? "text-stone-400" : "text-stone-500"
                    )}>
                      {provider.base_url}
                    </span>
                  </div>
                  
                  {selectedProviderId === provider.id && (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className={cn(
                "px-3 py-2 text-sm font-serif text-center",
                "sm:px-4 sm:py-3",
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
} 