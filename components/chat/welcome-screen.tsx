"use client"

import React, { useMemo, useState, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { TypeWriter } from "@components/ui/typewriter"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useWelcomeLayout } from "@lib/hooks/use-welcome-layout"
import { useTypewriterStore } from "@lib/stores/ui/typewriter-store"

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
  // 🎯 新增：TypeWriter重置键，确保应用切换时能够重新打字
  // --- END COMMENT ---
  const [typewriterKey, setTypewriterKey] = useState(0)
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：打字机状态管理
  // --- END COMMENT ---
  const { setWelcomeTypewriterComplete, resetWelcomeTypewriter } = useTypewriterStore()
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：动态打字速度配置
  // 根据文字长度智能调整打字速度，提升长文本体验
  // --- END COMMENT ---
  const typewriterConfig = useMemo(() => {
    const textLength = finalText.length
    
    // --- BEGIN COMMENT ---
    // 🎯 智能速度阈值配置
    // 短文本：慢速打字，营造仪式感
    // 中等文本：中速打字，平衡体验
    // 长文本：快速打字，避免等待过久
    // 超长文本：极速打字，快速完成
    // --- END COMMENT ---
    if (textLength <= 20) {
      // 短文本（≤20字符）：慢速打字，营造仪式感
      return {
        speed: 20,
        delay: 50,
        description: '短文本-慢速'
      }
    } else if (textLength <= 50) {
      // 中短文本（21-50字符）：标准速度
      return {
        speed: 15,
        delay: 40,
        description: '中短文本-标准'
      }
    } else if (textLength <= 100) {
      // 中等文本（51-100字符）：中速打字
      return {
        speed: 10,
        delay: 30,
        description: '中等文本-中速'
      }
    } else if (textLength <= 200) {
      // 长文本（101-200字符）：快速打字
      return {
        speed: 5,
        delay: 10,
        description: '长文本-快速'
      }
    } else {
      // 超长文本（>200字符）：极速打字
      return {
        speed: 8,
        delay: 100,
        description: '超长文本-极速'
      }
    }
  }, [finalText.length])
  
  // --- BEGIN COMMENT ---
  // 使用智能布局系统获取欢迎文字的位置和标题样式
  // --- END COMMENT ---
  const { welcomeText: welcomePosition, welcomeTextTitle, needsCompactLayout } = useWelcomeLayout()

  // --- BEGIN COMMENT ---
  // 🎯 直接从当前应用实例获取开场白配置
  // 完全基于数据库，无任何API调用
  // 添加验证状态保护，避免应用切换时显示错误内容
  // 🎯 新增：路径感知的状态保护，确保应用切换时序正确
  // --- END COMMENT ---
  const { currentAppInstance, isValidating, isLoading } = useCurrentApp()

  // --- BEGIN COMMENT ---
  // 🎯 移除复杂的应用切换检测逻辑，简化组件职责
  // 欢迎文字显示不应该依赖复杂的路径匹配和应用状态
  // --- END COMMENT ---

  // --- BEGIN COMMENT ---
  // 🎯 简化的欢迎文字显示逻辑
  // 优先级：数据库开场白 → 用户名问候 → 默认时间问候
  // 只要有用户名就能显示，不再依赖复杂的应用状态检查
  // --- END COMMENT ---
  useEffect(() => {
    console.log('[WelcomeScreen] 当前状态:', {
      username,
      hasOpeningStatement: !!currentAppInstance?.config?.dify_parameters?.opening_statement,
      currentAppId: currentAppInstance?.instance_id,
      pathname: window.location.pathname
    });

    // --- BEGIN COMMENT ---
    // 🎯 简化检查：只要用户名不是undefined就可以显示欢迎文字
    // 即使用户名是null也显示默认问候
    // --- END COMMENT ---
    if (username === undefined) {
      console.log('[WelcomeScreen] 等待用户信息加载...');
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 减少防抖延迟，提高响应速度
    // --- END COMMENT ---
    const updateTimer = setTimeout(() => {
      // --- BEGIN COMMENT ---
      // 🎯 重置打字机状态，准备开始新的打字动画
      // --- END COMMENT ---
      resetWelcomeTypewriter();
      
      // --- BEGIN COMMENT ---
      // 🎯 确定最终显示的文字 - 简化版本
      // --- END COMMENT ---
      let welcomeText = "";
      
      // --- BEGIN COMMENT ---
      // 🎯 从数据库config字段直接获取开场白（如果有的话）
      // --- END COMMENT ---
      const openingStatement = currentAppInstance?.config?.dify_parameters?.opening_statement;
      
      if (openingStatement && openingStatement.trim()) {
        // --- BEGIN COMMENT ---
        // 情况1：数据库中有应用的开场白配置
        // --- END COMMENT ---
        welcomeText = openingStatement.trim();
        console.log('[WelcomeScreen] 使用数据库开场白:', {
          appId: currentAppInstance?.instance_id,
          text: welcomeText.substring(0, 50) + '...'
        });
      } else if (username) {
        // --- BEGIN COMMENT ---
        // 情况2：没有开场白但有用户名 → 个性化时间问候
        // --- END COMMENT ---
        welcomeText = `${getTimeBasedGreeting()}，${username}`;
        console.log('[WelcomeScreen] 使用用户名问候:', welcomeText);
      } else {
        // --- BEGIN COMMENT ---
        // 情况3：没有用户名 → 默认时间问候
        // --- END COMMENT ---
        welcomeText = getTimeBasedGreeting();
        console.log('[WelcomeScreen] 使用默认问候:', welcomeText);
      }
      
      // --- BEGIN COMMENT ---
      // 🎯 直接设置文字并强制重新开始打字动画
      // --- END COMMENT ---
      setFinalText(welcomeText);
      setTypewriterKey(prev => prev + 1);
      
      console.log('[WelcomeScreen] 欢迎文字更新完成:', welcomeText);
    }, 50); // 减少到50ms，提高响应速度
    
    // 清理定时器
    return () => clearTimeout(updateTimer);
    
  }, [
    username, 
    currentAppInstance?.config?.dify_parameters?.opening_statement, 
    currentAppInstance?.instance_id,
    resetWelcomeTypewriter
  ]);

  // --- BEGIN COMMENT ---
  // 🎯 打字机完成回调
  // --- END COMMENT ---
  const handleTypewriterComplete = () => {
    console.log('[WelcomeScreen] 打字机动画完成，通知推荐问题组件开始渲染');
    setWelcomeTypewriterComplete(true);
  };

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
          🎯 优化：智能打字机效果，根据文字长度动态调整速度
          短文本：慢速打字，营造仪式感
          长文本：快速打字，避免等待过久
          🎯 添加key属性，确保应用切换时重新开始打字动画
          🎯 添加onComplete回调，通知推荐问题组件开始渲染
          --- END COMMENT --- */}
          <TypeWriter 
            key={typewriterKey} // 🎯 强制重新开始打字动画
            text={finalText}
            speed={typewriterConfig.speed} // 🎯 动态速度
            delay={typewriterConfig.delay} // 🎯 动态延迟
            waitingEffect={finalText.endsWith("...")}
            onComplete={handleTypewriterComplete} // 🎯 打字机完成回调
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