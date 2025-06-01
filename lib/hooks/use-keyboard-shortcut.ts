import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

export interface UseKeyboardShortcutOptions {
  shortcuts: KeyboardShortcut[];
  target?: HTMLElement | Document;
}

/**
 * 通用键盘快捷键Hook
 * 支持多个快捷键组合和条件启用/禁用
 */
export function useKeyboardShortcut(options: UseKeyboardShortcutOptions) {
  const { shortcuts, target = document } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      // 检查是否启用
      if (shortcut.enabled === false) {
        continue;
      }

      // 检查按键匹配
      const keyMatch = event.key === shortcut.key;
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

      if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.callback();
        break; // 只执行第一个匹配的快捷键
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    target.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, target]);
}

/**
 * 预定义的常用快捷键组合
 */
export const SHORTCUTS = {
  SAVE: { key: 'Enter', metaKey: true }, // Cmd+Enter (Mac)
  SAVE_ALT: { key: 'Enter', ctrlKey: true }, // Ctrl+Enter (Windows/Linux)
  CANCEL: { key: 'Escape' }, // Escape
  SUBMIT: { key: 'Enter' }, // Enter
  DELETE: { key: 'Delete' }, // Delete
  BACKSPACE: { key: 'Backspace' }, // Backspace
  COPY: { key: 'c', metaKey: true }, // Cmd+C
  PASTE: { key: 'v', metaKey: true }, // Cmd+V
  UNDO: { key: 'z', metaKey: true }, // Cmd+Z
  REDO: { key: 'z', metaKey: true, shiftKey: true }, // Cmd+Shift+Z
  SELECT_ALL: { key: 'a', metaKey: true }, // Cmd+A
  FIND: { key: 'f', metaKey: true }, // Cmd+F
  NEW: { key: 'n', metaKey: true }, // Cmd+N
  OPEN: { key: 'o', metaKey: true }, // Cmd+O
  REFRESH: { key: 'r', metaKey: true }, // Cmd+R
} as const;

/**
 * 简化的保存快捷键Hook
 */
export function useSaveShortcut(callback: () => void, enabled: boolean = true) {
  useKeyboardShortcut({
    shortcuts: [
      {
        ...SHORTCUTS.SAVE,
        callback,
        enabled,
      },
      {
        ...SHORTCUTS.SAVE_ALT,
        callback,
        enabled,
      },
    ],
  });
} 