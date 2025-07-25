'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';

import type * as React from 'react';

interface SidebarButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  active?: boolean;
  isLoading?: boolean;
  moreActionsTrigger?: React.ReactNode;
  isDisabled?: boolean;
  children?: React.ReactNode;
  variant?: 'default' | 'transparent'; // 新增：控制悬停效果样式
}

export function SidebarButton({
  icon,
  active = false,
  isLoading = false,
  className,
  onClick,
  moreActionsTrigger,
  isDisabled = false,
  children,
  variant = 'default',
  ...props
}: SidebarButtonProps) {
  const { isExpanded } = useSidebarStore();
  const { isDark } = useTheme();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    // 立即移除focus，避免影响父容器的cursor显示
    e.currentTarget.blur();

    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();

      const mockEvent = {
        ...e,
        type: 'click',
      } as unknown as React.MouseEvent<HTMLDivElement>;
      onClick?.(mockEvent);
    }
  };

  return (
    <div
      role="button"
      data-nav-button="true"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      className={cn(
        'relative flex items-center rounded-lg px-3 py-2 text-sm font-medium',
        'transition-all duration-150 ease-in-out',
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'select-none', // 防止文字选中
        isDark
          ? 'focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900'
          : 'focus-visible:ring-primary focus-visible:ring-offset-background',
        'h-10',
        // 恢复cursor-pointer，现在父容器使用cursor-e-resize不会冲突
        // disabled时使用cursor-not-allowed
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        !isDark &&
          !isDisabled && [
            'text-stone-600',
            variant === 'transparent'
              ? 'hover:bg-stone-300/80'
              : 'hover:bg-stone-300/80',
            active && 'bg-stone-300/90',
          ],
        !isDark && isDisabled && ['text-stone-400'],
        isDark &&
          !isDisabled && [
            'text-gray-200',
            variant === 'transparent'
              ? 'hover:bg-stone-600/60'
              : 'hover:bg-stone-600/60',
            active && 'bg-stone-600/80',
          ],
        isDark && isDisabled && ['text-gray-500'],
        isExpanded ? 'w-full' : 'w-10 justify-center',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center">
        {isLoading ? (
          <span
            className={cn(
              'flex h-5 w-5 flex-shrink-0 items-center justify-center'
            )}
          >
            <div
              className={cn(
                'h-4 w-4 animate-pulse rounded-full',
                isDark ? 'bg-stone-600' : 'bg-stone-400',
                'opacity-80'
              )}
            />
          </span>
        ) : (
          <span
            className={cn(
              '-ml-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            {icon}
          </span>
        )}
        {isExpanded && children && (
          <div
            className={cn(
              'ml-2 min-w-0 flex-1 truncate',
              'flex items-center leading-normal'
            )}
          >
            {children}
          </div>
        )}
      </div>
      {isExpanded && moreActionsTrigger && (
        <div
          className={cn('ml-1 flex-shrink-0')}
          onClick={e => {
            e.stopPropagation(); // Prevent click on MoreButton area from selecting the chat item
          }}
          // Optional: Add onKeyDown stopPropagation if needed, but Popover trigger should handle its own key events.
          // onKeyDown={(e) => e.stopPropagation()}
        >
          {moreActionsTrigger}
        </div>
      )}
    </div>
  );
}
