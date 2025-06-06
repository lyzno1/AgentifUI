"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@lib/utils"
import { useSettingsColors } from '@lib/hooks/use-settings-colors'
import { Settings, User, Palette, KeyRound, Shield } from "lucide-react"

// --- BEGIN COMMENT ---
// 定义设置选项，包括图标、标题和路径
// --- END COMMENT ---
export const settingsNavItems = [
  {
    title: "概览",
    href: "/settings",
    icon: Settings
  },
  {
    title: "个人资料",
    href: "/settings/profile",
    icon: User
  },
  {
    title: "账号设置",
    href: "/settings/account",
    icon: Shield
  },
  {
    title: "外观",
    href: "/settings/appearance",
    icon: Palette
  }
]

export function SettingsSidebar() {
  const pathname = usePathname()
  const { colors } = useSettingsColors();
  
  return (
    <div className="h-full">
      <div className="py-6">
        <div className="px-4 mb-6">
          <h2 className="text-xl font-semibold font-serif">设置</h2>
        </div>
        <nav className="space-y-1 px-2">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg mx-2",
                  "transition-colors duration-200",
                  isActive 
                    ? `${colors.sidebarItemActive.tailwind} font-medium` 
                    : colors.sidebarItemHover.tailwind
                )}
              >
                <span className="mr-3 flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-serif">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
