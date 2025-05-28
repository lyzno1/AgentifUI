'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@lib/utils';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { ProfileForm } from '@components/settings/profile-form';
import { getCurrentUserProfile } from '@lib/db/profiles';
import { Profile } from '@lib/types/database';
import { createClient } from '@lib/supabase/client';
import { useRouter } from 'next/navigation';
import { UserCircle } from 'lucide-react';

// --- BEGIN COMMENT ---
// 生成用户头像的首字母（与desktop-user-avatar保持一致）
// --- END COMMENT ---
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// --- BEGIN COMMENT ---
// 根据用户名生成一致的石色系背景颜色（与desktop-user-avatar保持一致）
// --- END COMMENT ---
const getAvatarBgColor = (name: string) => {
  const colors = [
    "#78716c", // stone-500
    "#57534e", // stone-600
    "#44403c", // stone-700
    "#64748b", // slate-500
    "#475569", // slate-600
    "#6b7280", // gray-500
    "#4b5563", // gray-600
    "#737373", // neutral-500
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// --- BEGIN COMMENT ---
// 个人资料设置页面
// 显示用户个人资料信息并提供编辑功能
// --- END COMMENT ---
export default function ProfileSettingsPage() {
  const { colors } = useSettingsColors();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const supabase = createClient();
  
  // --- BEGIN COMMENT ---
  // 加载用户资料数据
  // --- END COMMENT ---
  useEffect(() => {
    async function loadUserProfile() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 检查用户是否已登录
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        // 获取用户资料
        const result = await getCurrentUserProfile();
        if (result.success && result.data) {
          // --- BEGIN COMMENT ---
          // 将 auth 用户的上次登录时间添加到资料中
          // --- END COMMENT ---
          const enhancedProfile = {
            ...result.data,
            auth_last_sign_in_at: user.last_sign_in_at
          };
          
          setProfile(enhancedProfile);
        } else if (result.success && !result.data) {
          throw new Error('用户资料不存在');
        } else {
          throw new Error(result.error?.message || '无法获取用户资料');
        }
      } catch (err) {
        console.error('加载用户资料失败:', err);
        setError(err instanceof Error ? err : new Error('加载用户资料失败'));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserProfile();
  }, [router, supabase.auth]);
  
  // --- BEGIN COMMENT ---
  // 处理资料更新成功
  // --- END COMMENT ---
  const handleProfileUpdateSuccess = () => {
    // 刷新页面数据
    router.refresh();
  };
  
  // 处理错误情况
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6 font-serif">个人资料</h1>
        
        <div className={cn(
          "rounded-lg p-6",
          "border border-red-200 dark:border-red-800",
          "bg-red-50 dark:bg-red-900/20",
          "text-red-700 dark:text-red-300"
        )}>
          <h2 className="text-lg font-medium mb-4 text-red-800 dark:text-red-200 font-serif">加载资料时出错</h2>
          <p className="mb-4 font-serif">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className={cn(
              "px-4 py-2 rounded-lg",
              "bg-red-100 dark:bg-red-800/50",
              "hover:bg-red-200 dark:hover:bg-red-700/50",
              "text-red-800 dark:text-red-200",
              "transition-colors duration-200",
              "font-serif"
            )}
          >
            重试
          </button>
        </div>
      </motion.div>
    );
  }

  // 加载状态 - 使用骨架屏
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6 font-serif">个人资料</h1>
        
        <div className={cn(
          "w-full rounded-lg",
          "border",
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind,
          "p-6"
        )}>
          {/* 账户信息骨架屏 */}
          <div className={cn(
            "mb-8 p-4 rounded-lg border",
            colors.borderColor.tailwind,
          )}>
            <div className={cn(
              "h-6 w-32 mb-4",
              colors.skeletonBackground.tailwind,
              "animate-pulse rounded-md"
            )}></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center">
                  <div className={cn(
                    "w-5 h-5 mr-3",
                    colors.skeletonBackground.tailwind,
                    "animate-pulse rounded-full"
                  )}></div>
                  <div>
                    <div className={cn(
                      "h-3 w-16",
                      colors.skeletonBackground.tailwind,
                      "animate-pulse rounded-md"
                    )}></div>
                    <div className={cn(
                      "h-4 w-24 mt-1",
                      colors.skeletonBackground.tailwind,
                      "animate-pulse rounded-md"
                    )}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 个人资料表单骨架屏 */}
          <div className="space-y-6">
            <div className={cn(
              "h-6 w-32",
              colors.skeletonBackground.tailwind,
              "animate-pulse rounded-md"
            )}></div>
            
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className={cn(
                  "h-4 w-16",
                  colors.skeletonBackground.tailwind,
                  "animate-pulse rounded-md"
                )}></div>
                <div className={cn(
                  "h-10 w-full",
                  colors.skeletonBackground.tailwind,
                  "animate-pulse rounded-md"
                )}></div>
              </div>
            ))}
            
            <div className={cn(
              "h-12 w-full mt-8",
              colors.skeletonBackground.tailwind,
              "animate-pulse rounded-md"
            )}></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6 font-serif">个人资料</h1>
      
      {profile && (
        <div className={cn(
          "w-full rounded-lg",
          "border",
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind,
          "p-6"
        )}>
          {/* 用户资料头部 */}
          <div className="flex items-center mb-8">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.full_name || profile.username || '用户'}的头像`}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{
                    border: "none",
                  }}
                  onError={(e) => {
                    // 头像加载失败时隐藏图片
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-medium text-lg"
                  style={{
                    backgroundColor: getAvatarBgColor(profile.full_name || profile.username || '用户'),
                    border: "none",
                  }}
                >
                  {getInitials(profile.full_name || profile.username || '用户')}
                </div>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium font-serif">{profile.full_name || profile.username || '用户'}</h2>
              <p className={cn(
                "text-sm font-serif",
                colors.secondaryTextColor.tailwind
              )}>
                {profile.role === 'admin' ? '管理员' : '用户'}
              </p>
            </div>
          </div>
          
          {/* 个人资料表单 */}
          <ProfileForm 
            profile={profile} 
            onSuccess={handleProfileUpdateSuccess}
          />
        </div>
      )}
    </motion.div>
  );
}
