"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import { createClient } from '@lib/supabase/client';
import { useTheme } from '@lib/hooks/use-theme';
import { getAboutConfig, defaultAboutConfig, type AboutPageConfig } from '@lib/config/about-config';
import { cn } from '@lib/utils';

export default function AboutPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [aboutConfig, setAboutConfig] = useState<AboutPageConfig>(defaultAboutConfig);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // 确保客户端渲染一致性
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 根据主题获取颜色
  const getColors = () => {
    if (isDark) {
      return {
        titleGradient: 'from-stone-300 to-stone-500',
        textColor: 'text-gray-300',
        headingColor: 'text-gray-100',
        paragraphColor: 'text-gray-400',
        cardBg: 'bg-stone-700',
        cardBorder: 'border-stone-600',
        cardShadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        cardHeadingColor: 'text-stone-300',
        cardTextColor: 'text-gray-400',
        buttonClass: 'bg-stone-600 hover:bg-stone-500 text-gray-100 cursor-pointer hover:scale-105'
      };
    } else {
      return {
        titleGradient: 'from-stone-700 to-stone-900',
        textColor: 'text-stone-700',
        headingColor: 'text-stone-800',
        paragraphColor: 'text-stone-600',
        cardBg: 'bg-stone-100',
        cardBorder: 'border-stone-200',
        cardShadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
        cardHeadingColor: 'text-stone-700',
        cardTextColor: 'text-stone-600',
        buttonClass: 'bg-stone-800 hover:bg-stone-700 text-gray-100 cursor-pointer hover:scale-105'
      };
    }
  };
  
  const colors = mounted ? getColors() : {
    titleGradient: '',
    textColor: '',
    headingColor: '',
    paragraphColor: '',
    cardBg: '',
    cardBorder: '',
    cardShadow: '',
    cardHeadingColor: '',
    cardTextColor: '',
    buttonClass: ''
  };
  
  // 处理"开始探索"按钮点击
  const handleExploreClick = async () => {
    try {
      // 检查用户是否已登录
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 用户已登录，直接跳转到聊天页面
        router.push('/chat');
      } else {
        // 用户未登录，跳转到登录页面
        router.push('/login');
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      // 出错时默认跳转到登录页面
      router.push('/login');
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      // 🔒 安全修复：使用 getUser() 进行服务器端验证
      // 避免依赖可能被篡改的本地 session 数据
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    const loadConfig = async () => {
      try {
        const config = await getAboutConfig();
        setAboutConfig(config);
      } catch (error) {
        console.error('Failed to load about config:', error);
        // 加载失败时使用默认配置
      } finally {
        setConfigLoaded(true);
      }
    };

    checkUser();
    loadConfig();
  }, []);

  // --- BEGIN COMMENT ---
  // 在配置加载完成和客户端挂载完成前显示加载状态，避免时序问题
  // --- END COMMENT ---
  if (!mounted || !configLoaded) {
    return (
      <main className="min-h-screen w-full py-4 px-4 sm:py-6 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-20">
            <div className={cn(
              "text-lg",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              加载中...
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full py-4 px-4 sm:py-6 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {/* 标题部分 */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 lg:mb-10"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "font-bold bg-gradient-to-r bg-clip-text text-transparent leading-tight py-2",
              "text-3xl mb-4 sm:text-4xl md:text-5xl sm:mb-6",
              `${colors.titleGradient}`
            )}
          >
            {aboutConfig.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={cn(
              "max-w-3xl mx-auto font-light",
              "text-base sm:text-lg lg:text-xl",
              colors.textColor
            )}
          >
            {aboutConfig.subtitle}
          </motion.p>
        </motion.section>

        {/* 使命部分 */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 sm:mb-8 lg:mb-10"
        >
          <h2 className={cn(
            "font-bold mb-4 sm:mb-6",
            "text-xl sm:text-2xl",
            colors.headingColor
          )}>
            我们的使命
          </h2>
          <p className={cn(
            "text-sm sm:text-base lg:text-lg leading-relaxed",
            colors.paragraphColor
          )}>
            {aboutConfig.mission}
          </p>
        </motion.section>

        {/* 价值观部分 */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-6 sm:mb-8 lg:mb-10"
        >
          <h2 className={cn(
            "font-bold mb-4 sm:mb-6",
            "text-xl sm:text-2xl",
            colors.headingColor
          )}>
            我们的价值观
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {aboutConfig.valueCards.map((value, index) => (
              <motion.div 
                key={value.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className={cn(
                  "border rounded-xl",
                  "p-4 sm:p-6",
                  colors.cardBg,
                  colors.cardShadow,
                  colors.cardBorder
                )}
              >
                <h3 className={cn(
                  "font-semibold mb-2",
                  "text-base sm:text-lg",
                  colors.cardHeadingColor
                )}>
                  {value.title}
                </h3>
                <p className={cn(
                  "text-sm sm:text-base leading-relaxed",
                  colors.cardTextColor
                )}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 加入我们部分 */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mb-6 sm:mb-8 lg:mb-10"
        >
          <Button
            size="lg" 
            className={cn(
              "h-auto font-medium rounded-lg transition-all duration-200",
              "px-6 py-2 text-sm sm:px-8 sm:py-3 sm:text-base",
              colors.buttonClass
            )}
            onClick={handleExploreClick}
          >
            {aboutConfig.buttonText}
          </Button>
        </motion.section>
        
        {/* 底部信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={cn(
            "text-center",
            "text-xs sm:text-sm",
            colors.textColor
          )}
        >
          <p>
            {aboutConfig.copyrightText}
          </p>
        </motion.div>
      </div>
    </main>
  );
}
