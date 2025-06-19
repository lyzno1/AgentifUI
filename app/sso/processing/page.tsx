/**
 * SSO处理页面
 * 
 * 用于显示SSO登录处理状态，替代跳转到login页面
 * 包含加载指示器和状态信息
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { createClient } from '@lib/supabase/client';
import { cn } from '@lib/utils';

export default function SSOProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors, isDark } = useThemeColors();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('正在处理SSO登录...');
  const [error, setError] = useState<string>('');
  
  const hasProcessedRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleSSOProcessing = async () => {
      // --- 防止重复处理 ---
      if (hasProcessedRef.current || isProcessingRef.current) {
        return;
      }

      hasProcessedRef.current = true;
      isProcessingRef.current = true;

      try {
        // --- 获取URL参数 ---
        const ssoLogin = searchParams.get('sso_login');
        const welcome = searchParams.get('welcome');
        const redirectTo = searchParams.get('redirect_to') || '/chat';
        const userId = searchParams.get('user_id');
        const userEmail = searchParams.get('user_email');

        console.log('SSO Processing - URL params:', { ssoLogin, welcome, redirectTo, userId, userEmail });

        if (ssoLogin !== 'success' || !userId || !userEmail) {
          throw new Error('SSO参数缺失或无效');
        }

        setMessage(`欢迎 ${welcome || '用户'}，正在建立会话...`);

        // --- 读取SSO用户数据cookie ---
        const ssoUserCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('sso_user_data='));
        
        if (!ssoUserCookie) {
          throw new Error('SSO用户数据未找到');
        }
        
        const ssoUserData = JSON.parse(decodeURIComponent(ssoUserCookie.split('=')[1]));
        
        // --- 检查数据是否过期 ---
        if (Date.now() > ssoUserData.expiresAt) {
          throw new Error('SSO会话已过期，请重新登录');
        }

        setMessage('正在验证身份...');

        // --- 调用SSO登录API ---
        const response = await fetch('/api/auth/sso-signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            userEmail,
            ssoUserData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'SSO登录失败');
        }

        const { session } = await response.json();
        
        if (session) {
          setMessage('正在验证会话...');
          
          // --- 验证会话是否真正建立 ---
          const supabase = createClient();
          const { data: { user }, error: getUserError } = await supabase.auth.getUser();
          
          if (getUserError || !user) {
            throw new Error('会话验证失败');
          }
          
          console.log('会话验证成功，用户ID:', user.id);
          
          // --- 清理会话cookie ---
          document.cookie = 'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          setStatus('success');
          setMessage(`登录成功！正在跳转...`);
          
          // --- 跳转到目标页面 ---
          setTimeout(() => {
            console.log(`准备跳转到: ${redirectTo}`);
            router.replace(redirectTo);
          }, 1000);
        } else {
          throw new Error('服务器未返回有效会话数据');
        }
      } catch (err: any) {
        console.error('SSO处理失败:', err);
        setStatus('error');
        setError(err.message || 'SSO处理失败');
        setMessage('登录失败');
        
        // --- 清理可能存在的会话cookie ---
        document.cookie = 'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // --- 3秒后跳转到登录页面 ---
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      } finally {
        isProcessingRef.current = false;
      }
    };

    handleSSOProcessing();
  }, [searchParams, router]);

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      colors.mainBackground.tailwind
    )}>
      <div className={cn(
        "max-w-md w-full mx-4 p-8 rounded-xl shadow-lg border text-center space-y-6",
        isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
      )}>
        {/* --- 标题 --- */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
            SSO 登录
          </h1>
        </div>

        {/* --- 状态指示器 --- */}
        <div className="space-y-4">
          {status === 'processing' && (
            <div className="flex items-center justify-center space-x-3">
              <SpinnerIcon size={32} />
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-stone-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
          )}
        </div>

        {/* --- 状态消息 --- */}
        <div className="space-y-2">
          <p className={cn(
            "text-lg font-medium",
            status === 'success' ? "text-stone-600" : 
            status === 'error' ? "text-stone-600" : 
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            {message}
          </p>
          
          {error && (
            <p className={cn(
              "text-sm",
              isDark ? "text-red-400" : "text-red-600"
            )}>
              {error}
            </p>
          )}
          
          {status === 'error' && (
            <p className={cn(
              "text-xs mt-4",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              3秒后将自动跳转到登录页面...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpinnerIconProps {
  size?: number;
}

function SpinnerIcon({ size = 24 }: SpinnerIconProps) {
  const { isDark } = useThemeColors();
  
  return (
    <svg 
      className={cn(
        "animate-spin",
        isDark ? "text-stone-300" : "text-stone-600"
      )}
      width={size} 
      height={size} 
      xmlns="http://www.w3.org/2000/svg"
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
} 