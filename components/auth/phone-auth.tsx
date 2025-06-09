'use client'

import { useState } from 'react'
import { createClient } from '@lib/supabase/client'
import { Loader2, Phone, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'

export default function PhoneAuth() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const { isDark } = useTheme()
  const supabase = createClient()

  // --- 发送验证码 ---
  const sendOTP = async () => {
    if (!phone.trim()) {
      toast.error('请输入手机号')
      return
    }

    // 验证手机号格式（中国手机号）
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      toast.error('请输入正确的中国大陆手机号')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: `+86${phone}`, // 添加中国区号
      })

      if (error) throw error

      toast.success('验证码已发送，请查收短信')
      setStep('otp')
    } catch (error: any) {
      console.error('发送验证码失败:', error)
      toast.error(error.message || '发送验证码失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // --- 验证OTP ---
  const verifyOTP = async () => {
    if (!otp.trim()) {
      toast.error('请输入验证码')
      return
    }

    if (otp.length !== 6) {
      toast.error('验证码应为6位数字')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+86${phone}`,
        token: otp,
        type: 'sms',
      })

      if (error) throw error

      toast.success('验证成功！正在登录...')
      
      // 登录成功后重定向
      window.location.href = '/chat'
    } catch (error: any) {
      console.error('验证失败:', error)
      toast.error(error.message || '验证码错误，请重新输入')
    } finally {
      setLoading(false)
    }
  }

  // --- 重新发送验证码 ---
  const resendOTP = async () => {
    setStep('phone')
    setOtp('')
    await sendOTP()
  }

  return (
    <div className={cn(
      "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
      isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
    )}>
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent font-serif flex items-center justify-center gap-2">
          <Phone className="h-6 w-6 text-stone-600" />
          手机号登录
        </h2>
        <p className={cn(
          "mt-2 text-sm font-serif",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          {step === 'phone' 
            ? '使用手机号接收验证码登录' 
            : '请输入收到的6位验证码'
          }
        </p>
      </div>

      <div className="space-y-6">
        {step === 'phone' ? (
          <>
            {/* --- 手机号输入 --- */}
            <div>
              <label htmlFor="phone" className={cn(
                "block text-sm font-medium mb-1 font-serif",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>手机号</label>
              <div className="flex">
                <span className={cn(
                  "inline-flex items-center px-3 text-sm border border-r-0 rounded-l-lg font-serif",
                  isDark 
                    ? "bg-stone-800 border-stone-700 text-gray-300" 
                    : "bg-stone-100 border-stone-300 text-gray-600"
                )}>
                  +86
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="13812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className={cn(
                    "block w-full px-4 py-3 border rounded-r-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                    isDark 
                      ? "bg-stone-800 border-stone-700 text-white" 
                      : "bg-white border-stone-300"
                  )}
                  disabled={loading}
                />
              </div>
            </div>

            {/* --- 发送验证码按钮 --- */}
            <button 
              onClick={sendOTP} 
              disabled={loading || !phone.trim()}
              className={cn(
                "w-full h-12 text-base font-serif flex items-center justify-center gap-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                "bg-gradient-to-r from-stone-700 to-stone-600 hover:from-stone-800 hover:to-stone-700 text-white shadow-md hover:shadow-lg"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  发送验证码
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* --- OTP输入 --- */}
            <div>
              <label htmlFor="otp" className={cn(
                "block text-sm font-medium mb-1 font-serif",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>验证码</label>
              <input
                id="otp"
                type="text"
                placeholder="请输入6位验证码"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn(
                  "block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif text-center text-lg tracking-widest",
                  isDark 
                    ? "bg-stone-800 border-stone-700 text-white" 
                    : "bg-white border-stone-300"
                )}
                disabled={loading}
                maxLength={6}
              />
              <p className={cn(
                "mt-1 text-sm font-serif",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                验证码已发送至 +86{phone}
              </p>
            </div>

            {/* --- 验证按钮 --- */}
            <button 
              onClick={verifyOTP} 
              disabled={loading || otp.length !== 6}
              className={cn(
                "w-full h-12 text-base font-serif flex items-center justify-center gap-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                "bg-gradient-to-r from-stone-700 to-stone-600 hover:from-stone-800 hover:to-stone-700 text-white shadow-md hover:shadow-lg"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  验证中...
                </>
              ) : (
                '确认验证码'
              )}
            </button>

            {/* --- 重新发送 --- */}
            <button 
              onClick={resendOTP}
              disabled={loading}
              className={cn(
                "w-full h-10 text-sm font-serif rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                isDark 
                  ? "border-stone-700 text-gray-300 hover:bg-stone-800" 
                  : "border-stone-300 text-gray-700 hover:bg-stone-50"
              )}
            >
              重新发送验证码
            </button>

            {/* --- 返回修改手机号 --- */}
            <button 
              onClick={() => setStep('phone')}
              disabled={loading}
              className={cn(
                "w-full h-10 text-sm font-serif rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                isDark 
                  ? "text-gray-400 hover:text-gray-300 hover:bg-stone-800" 
                  : "text-gray-600 hover:text-gray-700 hover:bg-stone-50"
              )}
            >
              修改手机号
            </button>
          </>
        )}
      </div>
    </div>
  )
} 