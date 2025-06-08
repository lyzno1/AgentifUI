'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { cn } from '@lib/utils';
import { useTheme } from '@lib/hooks/use-theme';

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDark } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.name.trim()) {
      setError('请输入姓名');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    // 验证用户名格式（如果提供）
    if (formData.username.trim() && !/^[a-zA-Z0-9_-]{2,20}$/.test(formData.username.trim())) {
      setError('昵称只能包含字母、数字、下划线和连字符，长度2-20位');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // 使用 Supabase Auth 进行注册
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name.trim(), // 去除首尾空格
            username: formData.username.trim() || undefined, // 去除空格，如果为空则不传递
          },
        },
      });
      
      if (signUpError) {
        // 处理常见的注册错误
        if (signUpError.message.includes('already registered')) {
          throw new Error('该邮箱已被注册，请使用其他邮箱或直接登录');
        } else if (signUpError.message.includes('Password should be')) {
          throw new Error('密码强度不够，请使用更复杂的密码');
        } else if (signUpError.message.includes('Invalid email')) {
          throw new Error('邮箱格式不正确，请检查后重试');
        } else {
          throw signUpError;
        }
      }
      
      // 检查是否需要邮箱验证
      if (data.user && !data.user.email_confirmed_at) {
        // 需要邮箱验证
        router.push('/login?registered=true&verify=true');
      } else {
        // 直接注册成功（如果禁用了邮箱验证）
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4 sm:px-6 lg:px-8">
      <div className={cn(
        "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
        isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
      )}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">创建账户</h2>
          <p className={cn(
            "mt-2 text-sm font-serif",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            填写信息以创建您的新账户
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
            <label htmlFor="name" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              姓名
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="输入您的姓名"
            />
          </div>
          
          <div>
            <label htmlFor="username" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              昵称 <span className="text-gray-500 text-xs font-serif">(可选)</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="选择一个用户名"
            />
          </div>
          
          <div>
            <label htmlFor="email" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              邮箱地址
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="输入您的邮箱地址"
            />
          </div>

          <div>
            <label htmlFor="password" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="创建一个安全密码"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              确认密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="再次输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-stone-700 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-serif"
          >
            {isLoading ? '创建中...' : '创建账户'}
          </button>
        </form>

        <div className="text-center">
          <p className={cn(
            "text-sm font-serif",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            已有账户？{' '}
            <Link href="/login" className={cn(
              "font-medium font-serif",
              isDark ? "text-stone-400" : "text-stone-700 hover:text-stone-600"
            )}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 