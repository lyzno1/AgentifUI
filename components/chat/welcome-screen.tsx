"use client"

import React, { useMemo, useState, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { TypeWriter } from "@components/ui/typewriter"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useWelcomeLayout } from "@lib/hooks/use-welcome-layout"

interface WelcomeScreenProps {
  className?: string
  username?: string | null
}

// 北京时间获取方式
const getTimeBasedGreeting = () => {
  const now = new Date();
  const beijingTime = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: 'numeric',
    hour12: false
  }).format(now);
  
  const hour = parseInt(beijingTime);
  
  if (hour >= 6 && hour < 12) {
    return "早上好";
  } else if (hour >= 12 && hour < 18) {
    return "下午好";
  } else if (hour >= 18 && hour < 22) {
    return "晚上好";
  } else {
    return "夜深了";
  }
};

export const WelcomeScreen = ({ className, username }: WelcomeScreenProps) => {
  const { isDark } = useTheme()
  const [finalText, setFinalText] = useState("")
  
  // --- BEGIN COMMENT ---
  // 使用智能布局系统获取欢迎文字的位置和标题样式
  // --- END COMMENT ---
  const { welcomeText: welcomePosition, welcomeTextTitle, needsCompactLayout } = useWelcomeLayout()

  // --- BEGIN COMMENT ---
  // 🎯 直接从当前应用实例获取开场白配置
  // 完全基于数据库，无任何API调用
  // 添加验证状态保护，避免应用切换时显示错误内容
  // --- END COMMENT ---
  const { currentAppInstance, isValidating, isLoading } = useCurrentApp()

  // --- BEGIN COMMENT ---
  // 🎯 纯数据库策略的欢迎文字显示逻辑
  // 数据库有配置 → 使用开场白
  // 数据库无配置 → 用户名问候 → 默认问候
  // 移除骨架屏，依赖 PageLoadingSpinner 处理长时间加载
  // 添加验证状态保护，确保应用切换时序正确
  // --- END COMMENT ---
  useEffect(() => {
    // --- BEGIN COMMENT ---
    // 🎯 应用切换保护：验证期间不更新欢迎文字
    // 避免显示错误应用的开场白
    // --- END COMMENT ---
    if (isValidating || isLoading) {
      console.log('[WelcomeScreen] 应用正在验证或加载中，暂停更新欢迎文字');
      return;
    }

    // --- BEGIN COMMENT ---
    // 等待用户信息加载完成
    // --- END COMMENT ---
    if (username === undefined) {
      console.log('[WelcomeScreen] 等待用户信息加载...');
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 应用实例完整性检查：确保有完整的应用信息
    // --- END COMMENT ---
    if (!currentAppInstance?.instance_id) {
      console.log('[WelcomeScreen] 等待应用实例加载完成...');
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 确定最终显示的文字 - 纯数据库策略
    // --- END COMMENT ---
    let welcomeText = "";
    
    // --- BEGIN COMMENT ---
    // 🎯 从数据库config字段直接获取开场白
    // --- END COMMENT ---
    const openingStatement = currentAppInstance?.config?.dify_parameters?.opening_statement;
    
    if (openingStatement && openingStatement.trim()) {
      // --- BEGIN COMMENT ---
      // 情况1：数据库中有应用的开场白配置
      // --- END COMMENT ---
      welcomeText = openingStatement.trim();
      console.log('[WelcomeScreen] 使用数据库开场白:', {
        appId: currentAppInstance?.instance_id,
        source: 'database_config',
        text: welcomeText.substring(0, 50) + '...'
      });
    } else if (username) {
      // --- BEGIN COMMENT ---
      // 情况2：数据库无开场白配置，但有用户名 → 时间问候
      // --- END COMMENT ---
      welcomeText = `${getTimeBasedGreeting()}，${username}`;
      console.log('[WelcomeScreen] 数据库无开场白，使用用户名问候:', welcomeText);
    } else {
      // --- BEGIN COMMENT ---
      // 情况3：都没有 → 默认时间问候
      // --- END COMMENT ---
      welcomeText = getTimeBasedGreeting();
      console.log('[WelcomeScreen] 使用默认问候:', welcomeText);
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 直接设置文字，无需骨架屏
    // --- END COMMENT ---
    setFinalText(welcomeText);
    
  }, [
    username, 
    currentAppInstance?.config?.dify_parameters?.opening_statement, 
    currentAppInstance?.instance_id,
    isValidating, // 🎯 新增：监听验证状态
    isLoading     // �� 新增：监听加载状态
  ]);

  return (
      <div 
        className={cn(
          "welcome-screen flex flex-col items-center justify-center text-center",
          className
        )}
        style={welcomePosition}
      >

      <div className="w-full">
        {/* --- BEGIN COMMENT ---
        主标题容器：使用Hook提供的最高优先级宽度设置
        --- END COMMENT --- */}
        <h2 
          className={cn(
            "font-bold mb-2 mx-auto",
            needsCompactLayout ? "text-xl" : "text-2xl",
            "leading-tight"
          )}
          style={welcomeTextTitle}
        >
          {/* --- BEGIN COMMENT ---
          直接显示打字机效果，无骨架屏
          长时间加载由 PageLoadingSpinner 处理
          --- END COMMENT --- */}
          <TypeWriter 
            text={finalText}
            speed={30}
            delay={200} // 减少延迟，更快响应
            waitingEffect={finalText.endsWith("...")}
            className={cn(
              "font-bold leading-tight",
              needsCompactLayout ? "text-xl" : "text-3xl"
            )}
          />
        </h2>
      </div>
    </div>
  )
} 