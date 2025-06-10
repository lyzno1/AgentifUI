import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 创建 Supabase 服务器客户端
 * 用于服务器组件中访问 Supabase 服务
 * 注意：必须在服务器组件中使用此函数
 */
export const createClient = async () => {
  // 根据Next.js 15要求，cookies()需要被await
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
