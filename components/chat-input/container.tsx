'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { useWelcomeLayout } from '@lib/hooks/use-welcome-layout';
import { cn } from '@lib/utils';

// Container component - uses intelligent layout system
interface ChatContainerProps {
  children: React.ReactNode;
  isWelcomeScreen?: boolean;
  isDark?: boolean;
  className?: string;
  widthClass: string;
  // 是否正在从对话界面过渡到欢迎界面
  // 当为 true 时，使用闪烁效果而不是滑动
  // 当为 false 时，保持现有的滑动效果
  isTransitioningToWelcome?: boolean;
}

// 定义对话界面距离底部的距离
const INPUT_BOTTOM_MARGIN = '1rem';

export const ChatContainer = ({
  children,
  isWelcomeScreen = false,
  isDark = false,
  className,
  widthClass,
  isTransitioningToWelcome = false,
}: ChatContainerProps) => {
  // 获取主题颜色和智能布局位置
  const { colors } = useThemeColors();
  const { input: inputPosition } = useWelcomeLayout();

  // Base styles including absolute positioning and width
  // Simplified transition effects using opacity instead of sliding
  const baseClasses = cn(
    'absolute left-1/2 w-full', // 定位和宽度
    widthClass,
    // 使用闪烁过渡效果，只过渡透明度
    'transition-opacity duration-100 ease-in-out',
    className
  );

  // 动态计算样式，根据当前状态决定定位和变形
  // 欢迎界面使用智能布局系统，对话界面保持原有逻辑
  const dynamicStyles: React.CSSProperties = isWelcomeScreen
    ? {
        // 欢迎界面：使用智能布局系统计算的位置
        top: inputPosition.top,
        bottom: 'auto', // 确保 bottom 无效
        transform: inputPosition.transform,
        // 统一使用闪烁效果
        transition: 'opacity 100ms ease-in-out',
      }
    : {
        // 对话界面：基于底部定位，并通过 transform 水平居中
        top: 'auto', // 确保 top 无效
        bottom: INPUT_BOTTOM_MARGIN,
        transform: 'translateX(-50%)',
        // 统一使用闪烁效果
        transition: 'opacity 100ms ease-in-out',
      };

  return (
    <div className={baseClasses} style={dynamicStyles}>
      <div
        className={cn(
          'flex flex-col rounded-2xl',
          isDark ? colors.sidebarBackground.tailwind : 'bg-white',
          'shadow-[0_0_15px_rgba(0,0,0,0.1)]'
        )}
      >
        {children}
      </div>
    </div>
  );
};
