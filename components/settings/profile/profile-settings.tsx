'use client';

import { useProfile } from '@lib/hooks/use-profile';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';

import { useTranslations } from 'next-intl';

import { ProfileForm } from './profile-form';

// 个人资料设置组件
// 包含所有数据加载、状态管理和UI逻辑
export function ProfileSettings() {
  const { colors } = useSettingsColors();
  const { isDark } = useTheme();
  const t = useTranslations('pages.settings.profileSettings');
  const tCommon = useTranslations('common.ui');

  // 使用useProfile hook获取包含组织信息的完整用户资料
  const { profile, isLoading, error } = useProfile();

  // 处理资料更新成功
  const handleProfileUpdateSuccess = () => {
    // 刷新页面数据
    window.location.reload();
  };

  // 处理错误情况
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-6 font-serif text-2xl font-bold">{t('title')}</h1>

        <div
          className={cn(
            'mb-6 rounded-lg p-6',
            isDark
              ? 'border border-red-800 bg-red-900/20 text-red-300'
              : 'border border-red-200 bg-red-50 text-red-700'
          )}
        >
          <h2
            className={cn(
              'mb-4 font-serif text-lg font-medium',
              isDark ? 'text-red-200' : 'text-red-800'
            )}
          >
            {t('loadProfileError')}
          </h2>
          <p className="mb-4 font-serif">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className={cn(
              'rounded-md px-4 py-2 font-serif transition-colors',
              isDark
                ? 'bg-red-800/50 text-red-200 hover:bg-red-700/50'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            )}
          >
            {tCommon('retry')}
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
        <h1 className="mb-6 font-serif text-2xl font-bold">{t('title')}</h1>

        <div className="space-y-6">
          {/* 用户头像和基本信息骨架屏 - 紧凑布局 */}
          <div
            className={cn(
              'rounded-lg border p-4',
              colors.borderColor.tailwind,
              colors.cardBackground.tailwind
            )}
          >
            <div className="flex items-center space-x-4">
              {/* 头像骨架屏 - 缩小到16x16 */}
              <div
                className={cn(
                  'h-16 w-16 rounded-full',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse'
                )}
              ></div>
              {/* 基本信息骨架屏 */}
              <div className="flex-1 space-y-2">
                <div
                  className={cn(
                    'h-5 w-32',
                    colors.skeletonBackground.tailwind,
                    'animate-pulse rounded-md'
                  )}
                ></div>
                <div
                  className={cn(
                    'h-4 w-48',
                    colors.skeletonBackground.tailwind,
                    'animate-pulse rounded-md'
                  )}
                ></div>
              </div>
            </div>
          </div>

          {/* 账户信息骨架屏 - 紧凑网格布局 */}
          <div
            className={cn(
              'rounded-lg border p-4',
              colors.borderColor.tailwind,
              colors.cardBackground.tailwind
            )}
          >
            <div
              className={cn(
                'mb-3 h-4 w-20',
                colors.skeletonBackground.tailwind,
                'animate-pulse rounded-md'
              )}
            ></div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map(item => (
                <div key={item} className="flex items-center space-x-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded',
                      colors.skeletonBackground.tailwind,
                      'animate-pulse'
                    )}
                  ></div>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        'h-3 w-16',
                        colors.skeletonBackground.tailwind,
                        'animate-pulse rounded-md'
                      )}
                    ></div>
                    <div
                      className={cn(
                        'h-4 w-24',
                        colors.skeletonBackground.tailwind,
                        'animate-pulse rounded-md'
                      )}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 编辑表单骨架屏 - 简化布局 */}
          <div
            className={cn(
              'rounded-lg border p-4',
              colors.borderColor.tailwind,
              colors.cardBackground.tailwind
            )}
          >
            <div className="mb-4 flex items-center">
              <div
                className={cn(
                  'mr-2 h-4 w-4',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse rounded'
                )}
              ></div>
              <div
                className={cn(
                  'h-4 w-20',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse rounded-md'
                )}
              ></div>
            </div>

            <div className="space-y-4">
              {/* 表单字段骨架屏 */}
              {[1, 2].map(item => (
                <div key={item} className="space-y-1">
                  <div
                    className={cn(
                      'h-4 w-16',
                      colors.skeletonBackground.tailwind,
                      'animate-pulse rounded-md'
                    )}
                  ></div>
                  <div
                    className={cn(
                      'h-12 w-full rounded-lg border',
                      colors.borderColor.tailwind,
                      colors.skeletonBackground.tailwind,
                      'animate-pulse'
                    )}
                  ></div>
                </div>
              ))}

              {/* 提交按钮骨架屏 */}
              <div
                className={cn(
                  'h-10 w-full rounded-lg',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse'
                )}
              ></div>
            </div>
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
      <h1 className="mb-6 font-serif text-2xl font-bold">{t('title')}</h1>

      {profile && (
        <ProfileForm
          profile={profile as any}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}
    </motion.div>
  );
}
