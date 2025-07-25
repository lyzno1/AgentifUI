'use client';

import { LogoutConfirmDialog, UserAvatar } from '@components/ui';
import { useProfile } from '@lib/hooks/use-profile';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';
import { Clock, Info, LogOut, Sliders, UserCircle, Wrench } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

/**
 * 桌面端用户头像菜单组件
 * 特点：
 * - 纯圆形头像设计，无外框
 * - 使用useProfile hook获取用户信息，确保与认证状态同步
 * - 使用内联样式确保主题一致性
 * - 优化的渲染性能，减少重新渲染
 */
export function DesktopUserAvatar() {
  const { isDark } = useThemeColors();
  const router = useRouter();
  const t = useTranslations('navbar.user');
  const tRoles = useTranslations('pages.settings.profileSettings.roles');

  // 使用useProfile hook获取用户信息，自动处理缓存和认证状态同步
  const { profile } = useProfile();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 切换下拉菜单
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(prev => {
      if (prev) {
        // 关闭菜单时重置悬停状态
        setHoveredItem(null);
      }
      return !prev;
    });
  };

  // 处理菜单项点击
  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
    setHoveredItem(null);
  };

  // 处理退出登录 - 显示确认对话框
  const handleLogout = () => {
    setShowLogoutDialog(true);
    setIsDropdownOpen(false);
    setHoveredItem(null);
  };

  // 菜单项定义
  const menuItems = [
    {
      icon: Clock,
      label: t('history'),
      action: () => router.push('/chat/history'),
    },
    {
      icon: Sliders,
      label: t('settings'),
      action: () => router.push('/settings'),
    },
    {
      icon: Info,
      label: t('about'),
      action: () => router.push('/about'),
    },
  ];

  // 管理员专用菜单项，仅对管理员用户显示
  const adminMenuItems = [
    {
      icon: Wrench,
      label: t('admin'),
      action: () => router.push('/admin'),
    },
  ];

  // 根据用户角色合并菜单项
  const allMenuItems =
    profile?.role === 'admin' ? [...menuItems, ...adminMenuItems] : menuItems;

  const isLoggedIn = !!profile;
  const userName = profile?.full_name || profile?.username || t('userMenu');
  const userRole =
    profile?.role === 'admin'
      ? tRoles('admin')
      : profile?.role === 'manager'
        ? tRoles('manager')
        : tRoles('user'); // 显示用户角色而不是固定的"群组系统"
  const avatarUrl = profile?.avatar_url;

  return (
    <>
      {/* 退出登录确认对话框 */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      />

      <div className="relative mr-1">
        {/* 纯圆形头像按钮 - 使用内联样式避免闪烁 */}
        <button
          ref={triggerRef}
          onClick={toggleDropdown}
          className="relative cursor-pointer rounded-full transition-all duration-200 hover:ring-2 hover:ring-gray-400/50 focus:outline-none"
          style={{
            padding: 0,
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={isLoggedIn ? t('userMenu') : t('login')}
        >
          {isLoggedIn ? (
            <>
              {/* 纯圆形头像 - 无边框 */}
              <UserAvatar
                avatarUrl={avatarUrl}
                userName={userName}
                size="lg"
                className="h-9 w-9 transition-all duration-200"
              />
            </>
          ) : (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#57534e' : '#f5f5f4',
                color: isDark ? '#e7e5e4' : '#57534e',
                border: `2px solid ${isDark ? '#44403c' : '#d6d3d1'}`,
                transition: 'all 0.2s',
              }}
            >
              <UserCircle size={18} />
            </div>
          )}
        </button>

        {/* 下拉菜单 */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'animate-slide-in-down absolute top-12 -right-2 z-50 w-64 rounded-xl border p-2 shadow-xl',
              isDark
                ? 'border-[#44403c] bg-[#18130f]'
                : 'border-[#e7e5e4] bg-[#f5f5f4]'
            )}
          >
            {isLoggedIn ? (
              <>
                {/* 用户信息头部 - 无头像版本 */}
                <div
                  className={cn(
                    'mb-2 rounded-lg p-3',
                    isDark
                      ? 'bg-[rgba(120,113,108,0.3)]'
                      : 'bg-[rgba(231,229,228,0.8)]'
                  )}
                >
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate font-serif text-sm font-semibold',
                          isDark ? 'text-[#f5f5f4]' : 'text-[#1c1917]'
                        )}
                      >
                        {userName}
                      </p>
                      <p
                        className={cn(
                          'truncate font-serif text-xs',
                          isDark ? 'text-[#a8a29e]' : 'text-[#78716c]'
                        )}
                      >
                        {userRole}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 分割线 */}
                <div
                  className={cn(
                    'mb-2 h-px w-full',
                    isDark ? 'bg-[#44403c]' : 'bg-[#e7e5e4]'
                  )}
                />

                {/* 菜单项 */}
                <div className="space-y-1">
                  {allMenuItems.map((item, index) => {
                    const itemKey = `menu-${index}`;
                    const isHovered = hoveredItem === itemKey;

                    return (
                      <button
                        key={index}
                        onClick={() => handleMenuItemClick(item.action)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus:outline-none',
                          isDark
                            ? isHovered
                              ? 'bg-[#44403c]/50 text-[#d6d3d1]'
                              : 'bg-transparent text-[#d6d3d1]'
                            : isHovered
                              ? 'bg-[#e7e5e4] text-[#44403c]'
                              : 'bg-transparent text-[#44403c]'
                        )}
                        onMouseEnter={() => setHoveredItem(itemKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4',
                            isDark ? 'text-[#a8a29e]' : 'text-[#57534e]'
                          )}
                        />
                        <span
                          className={cn(
                            'flex-1 font-serif text-sm',
                            isDark ? 'text-[#d6d3d1]' : 'text-[#44403c]'
                          )}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 分割线 */}
                <div
                  className={cn(
                    'my-2 h-px w-full',
                    isDark ? 'bg-[#44403c]' : 'bg-[#e7e5e4]'
                  )}
                />

                {/* 退出登录 */}
                <button
                  onClick={handleLogout}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-serif text-sm transition-colors duration-150 focus:outline-none',
                    'text-[#dc2626]',
                    hoveredItem === 'logout'
                      ? isDark
                        ? 'bg-[rgba(153,27,27,0.2)]'
                        : 'bg-[rgba(254,226,226,1)]'
                      : 'bg-transparent'
                  )}
                  onMouseEnter={() => setHoveredItem('logout')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-serif text-sm">{t('logout')}</span>
                </button>
              </>
            ) : (
              <div className="p-4">
                {/* 未登录状态 */}
                <div
                  className={cn(
                    'mb-6 rounded-xl px-4 py-6 text-center',
                    isDark
                      ? 'bg-[rgba(120,113,108,0.3)] text-[#d6d3d1]'
                      : 'bg-[rgba(231,229,228,0.8)] text-[#57534e]'
                  )}
                >
                  <UserCircle
                    className="mx-auto mb-3 h-16 w-16"
                    style={{
                      color: isDark ? '#a8a29e' : '#78716c',
                    }}
                  />
                  <p className="font-serif font-medium">{t('loginPrompt')}</p>
                  <p className="mt-1 font-serif text-sm opacity-75">
                    {t('loginDescription')}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() =>
                      handleMenuItemClick(() => router.push('/login'))
                    }
                    className={cn(
                      'w-full transform rounded-xl px-4 py-3 text-center font-serif font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl',
                      hoveredItem === 'login' ? 'bg-[#44403c]' : 'bg-[#57534e]'
                    )}
                    onMouseEnter={() => setHoveredItem('login')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('login')}
                  </button>

                  <button
                    onClick={() =>
                      handleMenuItemClick(() => router.push('/register'))
                    }
                    className={cn(
                      'w-full transform rounded-xl border px-4 py-3 text-center font-serif font-medium shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                      hoveredItem === 'register'
                        ? isDark
                          ? 'border-[#57534e] bg-[#57534e] text-[#e7e5e4]'
                          : 'border-[#d6d3d1] bg-[#d6d3d1] text-[#44403c]'
                        : isDark
                          ? 'border-[#57534e] bg-[#44403c] text-[#e7e5e4]'
                          : 'border-[#d6d3d1] bg-[#f5f5f4] text-[#44403c]'
                    )}
                    onMouseEnter={() => setHoveredItem('register')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('register')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
