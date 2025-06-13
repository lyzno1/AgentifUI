'use client';

import React, { useEffect } from 'react';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon, XIcon } from 'lucide-react';
import { cn } from '@lib/utils';
import { useNotificationStore } from '@lib/stores/ui/notification-store';

const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

const colorMap = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-red-500 border-red-600',
  warning: 'bg-yellow-500 border-yellow-600',
  info: 'bg-stone-500 border-stone-600',
};

export const NotificationBar: React.FC = () => {
  const { message, type, isVisible, hideNotification } = useNotificationStore();

  // 如果不可见或没有消息，则不渲染任何内容
  if (!isVisible || !message) {
    return null;
  }

  const IconComponent = iconMap[type] || InfoIcon; // 默认使用 InfoIcon
  const colors = colorMap[type] || colorMap.info; // 默认使用 info 颜色

  return (
    <div
      className={cn(
        'fixed top-5 left-1/2 transform -translate-x-1/2 z-50', // 定位在顶部居中
        'w-auto max-w-[90%] md:max-w-md lg:max-w-lg', // 响应式宽度
        'p-3 rounded-md shadow-lg border text-white flex items-center space-x-3', // 基础样式
        colors, // 根据类型应用颜色
        'transition-all duration-300 ease-in-out', // 过渡动画
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4' // 显示/隐藏动画
      )}
      role="alert"
    >
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span className="flex-grow text-sm font-medium">{message}</span>
      <button
        onClick={hideNotification}
        className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="关闭通知"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}; 