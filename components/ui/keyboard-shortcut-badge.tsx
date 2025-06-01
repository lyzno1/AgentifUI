'use client';

import React from 'react';
import { cn } from '@lib/utils';
import { useTheme } from '@lib/hooks/use-theme';

export interface KeyboardShortcutBadgeProps {
  keys: string[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

/**
 * 键盘快捷键徽章组件
 * 用于显示快捷键组合，支持多种尺寸和样式
 */
export function KeyboardShortcutBadge({
  keys,
  size = 'md',
  variant = 'default',
  className
}: KeyboardShortcutBadgeProps) {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      key: 'px-1 py-0.5 text-xs min-w-[20px] h-[18px]',
      separator: 'text-xs'
    },
    md: {
      container: 'gap-1.5',
      key: 'px-1 py-0.5 text-sm min-w-[32px] h-[24px]',
      separator: 'text-sm'
    },
    lg: {
      container: 'gap-2',
      key: 'px-1.5 py-1 text-base min-w-[36px] h-[28px]',
      separator: 'text-base'
    }
  };

  const variantClasses = {
    default: isDark
      ? 'bg-stone-700/90 text-stone-200 border border-stone-500/60 shadow-sm'
      : 'bg-stone-700/25 text-stone-100 border border-stone-600/40 shadow-sm',
    outline: isDark
      ? 'bg-transparent text-stone-300 border border-stone-500/60'
      : 'bg-transparent text-stone-700 border border-stone-400/60',
    ghost: isDark
      ? 'bg-stone-800/50 text-stone-300 border-0'
      : 'bg-stone-100/50 text-stone-700 border-0'
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <div className={cn(
      'flex items-center',
      currentSize.container,
      className
    )}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <span className={cn(
            'rounded-md font-mono font-semibold flex items-center justify-center',
            currentSize.key,
            currentVariant
          )}>
            {key}
          </span>
          {index < keys.length - 1 && (
            <span className={cn(
              'opacity-70 font-medium',
              currentSize.separator,
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}>
              +
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * 预定义的快捷键组合
 */
export const SHORTCUT_KEYS = {
  SAVE: ['Cmd', 'Enter'],
  SAVE_WIN: ['Ctrl', 'Enter'],
  CANCEL: ['Esc'],
  SUBMIT: ['Enter'],
  DELETE: ['Del'],
  COPY: ['Cmd', 'C'],
  PASTE: ['Cmd', 'V'],
  UNDO: ['Cmd', 'Z'],
  REDO: ['Cmd', 'Shift', 'Z'],
  SELECT_ALL: ['Cmd', 'A'],
  FIND: ['Cmd', 'F'],
  NEW: ['Cmd', 'N'],
  OPEN: ['Cmd', 'O'],
  REFRESH: ['Cmd', 'R'],
} as const;

/**
 * 根据操作系统自动选择快捷键
 */
export function getShortcutKeys(action: keyof typeof SHORTCUT_KEYS): string[] {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  switch (action) {
    case 'SAVE':
      return isMac ? SHORTCUT_KEYS.SAVE : SHORTCUT_KEYS.SAVE_WIN;
    default:
      return SHORTCUT_KEYS[action];
  }
}

/**
 * 保存按钮快捷键徽章（自动适配操作系统）
 */
export function SaveShortcutBadge(props: Omit<KeyboardShortcutBadgeProps, 'keys'>) {
  return (
    <KeyboardShortcutBadge
      keys={getShortcutKeys('SAVE')}
      {...props}
    />
  );
} 