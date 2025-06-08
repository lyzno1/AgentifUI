'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { ArrowLeft, Mail } from 'lucide-react';
import { cn } from '@lib/utils';
import { useTheme } from '@lib/hooks/use-theme';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError('');
    
    try {
      const supabase = createClient();
      
      // --- 发送重置密码邮件 ---
      // 使用Supabase Auth内置的resetPasswordForEmail方法
      // 邮件中的链接将包含重置token并重定向到reset-password页面
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log('发送重置密码邮件，重定向URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      console.log('重置邮件发送结果:', error ? '失败' : '成功');
      
      if (error) {
        // --- 处理常见错误情况 ---
        if (error.message.includes('Invalid email')) {
          throw new Error('请输入有效的邮箱地址');
        } else if (error.message.includes('rate limit')) {
          throw new Error('发送过于频繁，请稍后再试');
        } else {
          throw error;
        }
      }
      
      // --- 发送成功 ---
      setIsEmailSent(true);
    } catch (err: any) {
      setError(err.message || '发送失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // --- 清除之前的错误信息 ---
    if (error) setError('');
  };

  // --- 邮件发送成功状态的UI ---
  if (isEmailSent) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4 sm:px-6 lg:px-8",
        isDark ? "bg-stone-900" : "bg-stone-50"
      )}>
        <div className={cn(
          "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
          isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
        )}>
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
              isDark ? "bg-stone-800" : "bg-stone-100"
            )}>
              <Mail className={cn(
                "w-8 h-8",
                isDark ? "text-stone-400" : "text-stone-600"
              )} />
            </div>
            <h2 className={cn(
              "text-xl sm:text-2xl font-bold text-stone-900 font-serif",
              isDark ? "bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent" : ""
            )}>
              邮件已发送
            </h2>
            <p className={cn(
              "mt-2 text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              我们已向 <span className={cn(
                "font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>{email}</span> 发送了重置密码链接
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg text-sm border-l-4 font-serif",
            isDark ? "bg-stone-800/50 text-stone-300 border-stone-600" : "bg-stone-50 text-stone-700 border-stone-400"
          )}>
            <p>请检查您的邮箱（包括垃圾邮件文件夹）并点击链接重置密码。</p>
            <p className="mt-2">如果您没有收到邮件，请检查邮箱地址是否正确或稍后重试。</p>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className={cn(
                "flex items-center justify-center text-sm transition-colors font-serif",
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-700 hover:text-stone-600"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- 主要的忘记密码表单UI ---
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4 sm:px-6 lg:px-8",
      isDark ? "bg-stone-900" : "bg-stone-50"
    )}>
      <div className={cn(
        "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
        isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
      )}>
        <div className="text-center">
          <h2 className={cn(
            "text-xl sm:text-2xl font-bold text-stone-900 font-serif",
            isDark ? "bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent" : ""
          )}>
            忘记密码
          </h2>
          <p className={cn(
            "mt-2 text-sm font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            输入您的邮箱地址，我们将发送重置密码链接
          </p>
        </div>

        {error && (
          <div className={cn(
            "p-4 rounded-lg text-sm border-l-4 font-serif",
            isDark ? "bg-red-900/30 text-red-400 border-red-500" : "bg-red-50 text-red-700 border-red-500"
          )}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              邮箱地址
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className={cn(
              "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-stone-700 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-serif",
              isDark ? "bg-stone-800 hover:bg-stone-700" : "bg-stone-500 hover:bg-stone-600"
            )}
          >
            {isLoading ? '发送中...' : '发送重置链接'}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className={cn(
              "flex items-center justify-center text-sm transition-colors font-serif",
              isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-700 hover:text-stone-600"
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
} 