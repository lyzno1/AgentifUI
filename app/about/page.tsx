"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import { createClient } from '@lib/supabase/client';
import { useTheme } from '@lib/hooks/use-theme';

export default function AboutPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
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

    checkUser();
  }, []);

  return (
    <main className="min-h-screen w-full py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {/* 标题部分 */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${colors.titleGradient} bg-clip-text text-transparent mb-6 leading-tight py-2`}

          >
            关于 AgentifUI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-xl ${colors.textColor} max-w-3xl mx-auto font-light`}
          >
            连接 AI 与企业，打造大模型应用新体验
          </motion.p>
        </motion.section>

        {/* 使命部分 */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-10"
        >
          <h2 className={`text-2xl font-bold ${colors.headingColor} mb-6`}>我们的使命</h2>
          <p className={`text-lg ${colors.paragraphColor}`}>
            AgentifUI 致力于利用大型语言模型的力量，为企业和教育机构提供创新的应用解决方案。
            我们整合了多种模型供应商的能力，并基于 Dify 后端提供稳定、可靠的服务，帮助组织充分利用 AI 技术的价值。
          </p>
        </motion.section>

        {/* 价值观部分 */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-10"
        >
          <h2 className={`text-2xl font-bold ${colors.headingColor} mb-6`}>我们的价值观</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "技术创新", description: "持续集成前沿的大模型技术，为企业提供领先的 AI 解决方案" },
              { title: "数据安全", description: "支持私有化部署和严格的数据保护措施，确保企业数据的安全与隐私" },
              { title: "灵活定制", description: "提供高度可定制的解决方案，满足不同行业和场景的特定需求" },
              { title: "知识增强", description: "通过 RAG 技术实现私有知识库的整合，增强模型的上下文感知能力" }
            ].map((value, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className={`${colors.cardBg} ${colors.cardShadow} border ${colors.cardBorder} rounded-xl p-6`}
              >
                <h3 className={`text-lg font-semibold ${colors.cardHeadingColor} mb-2`}>{value.title}</h3>
                <p className={`${colors.cardTextColor}`}>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 加入我们部分 */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mb-10"
        >
          {/* "加入我们"标题和段落已根据用户要求移除 */}
          <Button
            size="lg" 
            className={`${colors.buttonClass} px-8 py-3 h-auto text-base font-medium rounded-lg transition-all duration-200`}
            onClick={handleExploreClick}
          >
            开始探索
          </Button>
        </motion.section>
        
        {/* 底部信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={`text-center ${colors.textColor} text-sm`}
        >
          <p>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> AgentifUI. 探索大模型应用的未来。
          </p>
        </motion.div>
      </div>
    </main>
  );
}
