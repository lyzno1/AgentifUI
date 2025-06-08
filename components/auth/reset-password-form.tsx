'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { cn } from '@lib/utils';
import { useTheme } from '@lib/hooks/use-theme';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const { isDark } = useTheme();

  // --- 验证用户认证状态 ---
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const supabase = createClient();
        
        // --- 调试：显示所有URL参数 ---
        console.log('=== 重置密码调试信息 ===');
        console.log('完整URL:', window.location.href);
        console.log('URL参数:', window.location.search);
        
        // --- 检查URL参数 ---
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const token_hash = searchParams.get('token_hash');
        
        console.log('URL参数解析:');
        console.log('- access_token:', access_token);
        console.log('- refresh_token:', refresh_token);
        console.log('- type:', type);
        console.log('- token_hash:', token_hash);
        
        // --- 处理Supabase的重置密码重定向 ---
        if (type === 'recovery' && token_hash) {
          console.log('检测到Supabase重置密码链接，尝试验证token');
          
          // 使用正确的方法处理重置密码token
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: token_hash,
          });
          
          if (verifyError) {
            console.error('重置密码token验证失败:', verifyError);
            setError(`重置链接验证失败: ${verifyError.message}`);
            setIsTokenValid(false);
          } else {
            console.log('重置密码token验证成功:', data);
            setIsTokenValid(true);
          }
          return;
        }
        
        // --- 处理直接的access_token（兼容旧版本） ---
        if (access_token) {
          console.log('检测到access_token，尝试设置会话');
          
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });

          if (sessionError) {
            console.error('会话设置失败:', sessionError);
            setError(`重置链接验证失败: ${sessionError.message}`);
            setIsTokenValid(false);
          } else {
            console.log('会话设置成功');
            setIsTokenValid(true);
          }
          return;
        }
        
        // --- 检查是否已有有效会话 ---
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('获取用户信息失败:', userError);
          setError('无法验证用户身份，请重新申请重置密码');
          setIsTokenValid(false);
        } else if (user) {
          console.log('用户已认证:', user.email);
          setIsTokenValid(true);
        } else {
          console.log('用户未认证，且无有效的重置token');
          setError('重置链接无效或已过期，请重新申请重置密码');
          setIsTokenValid(false);
        }
        
      } catch (err) {
        console.error('会话验证异常:', err);
        setError('验证失败，请重新申请重置密码');
        setIsTokenValid(false);
      }
    };

    checkUserSession();
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // --- 清除错误信息 ---
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.password.trim()) {
      setError('请输入新密码');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const supabase = createClient();
      
      // --- 更新密码 ---
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });
      
      if (error) {
        // --- 处理常见错误 ---
        if (error.message.includes('Password should be')) {
          throw new Error('密码强度不够，请使用更复杂的密码');
        } else if (error.message.includes('session')) {
          throw new Error('会话已过期，请重新申请重置密码');
        } else {
          throw error;
        }
      }
      
      // --- 重置成功 ---
      setIsSuccess(true);
      
      // --- 3秒后跳转到登录页面 ---
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || '密码重置失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Token验证中的加载状态 ---
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
          isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
        )}>
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse",
              isDark ? "bg-stone-800" : "bg-stone-100"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full",
                isDark ? "bg-stone-600" : "bg-stone-300"
              )}></div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">验证中</h2>
            <p className={cn(
              "mt-2 text-sm font-serif",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              正在验证重置链接...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Token无效状态 ---
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
          isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
        )}>
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
              isDark ? "bg-stone-800" : "bg-stone-100"
            )}>
              <AlertCircle className={cn(
                "w-8 h-8",
                isDark ? "text-stone-400" : "text-stone-600"
              )} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">链接无效</h2>
            <p className={cn(
              "mt-2 text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              重置密码链接已过期或无效
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

          <div className="text-center">
            <Link
              href="/forgot-password"
              className={cn(
                "inline-flex items-center text-sm text-stone-700 hover:text-stone-600 transition-colors font-serif",
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-700 hover:text-stone-600"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              重新申请重置密码
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- 重置成功状态 ---
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
          isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
        )}>
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
              isDark ? "bg-stone-800" : "bg-stone-100"
            )}>
              <CheckCircle className={cn(
                "w-8 h-8",
                isDark ? "text-stone-400" : "text-stone-600"
              )} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">密码重置成功</h2>
            <p className={cn(
              "mt-2 text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              您的密码已成功重置
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg text-sm border-l-4 font-serif",
            isDark ? "bg-stone-800/50 text-stone-300 border-stone-600" : "bg-stone-50 text-stone-700 border-stone-400"
          )}>
            <p>您现在可以使用新密码登录您的账户。</p>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center text-sm text-stone-700 hover:text-stone-600 transition-colors font-serif",
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-700 hover:text-stone-600"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              前往登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- 主要的重置密码表单 ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4 sm:px-6 lg:px-8">
      <div className={cn(
        "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
        isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
      )}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">重置密码</h2>
          <p className={cn(
            "mt-2 text-sm font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            请输入您的新密码
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
            <label htmlFor="password" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              新密码
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="输入新密码"
            />
            {formData.password && (
              <p className={cn(
                "mt-1 text-xs font-serif",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                密码需包含大小写字母、数字，至少8位
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={cn(
              "block text-sm font-medium mb-1 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              确认密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={cn(
                "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                isDark ? "bg-stone-800 border-stone-700 text-white" : "border-gray-300 text-gray-900"
              )}
              placeholder="再次输入新密码"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.password || !formData.confirmPassword || !!error}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-stone-700 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-serif"
          >
            {isLoading ? '重置中...' : '重置密码'}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className={cn(
              "text-sm transition-colors font-serif",
              isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-700 hover:text-stone-600"
            )}
          >
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
} 