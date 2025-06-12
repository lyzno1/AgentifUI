"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { FileText, Bell } from 'lucide-react'

interface ContentTabsProps {
  activeTab: 'about' | 'notifications'
  onTabChange: (tab: 'about' | 'notifications') => void
}

export function ContentTabs({ activeTab, onTabChange }: ContentTabsProps) {
  const { isDark } = useTheme()

  const tabs = [
    {
      key: 'about' as const,
      label: 'About',
      icon: FileText
    },
    {
      key: 'notifications' as const,
      label: '通知',
      icon: Bell
    }
  ]

  return (
    <div className={cn(
      "inline-flex items-center rounded-lg border p-1",
      isDark ? "bg-stone-700 border-stone-600" : "bg-stone-100 border-stone-300"
    )}>
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
            activeTab === key
              ? isDark 
                ? "bg-stone-600 text-stone-100 shadow-sm" 
                : "bg-white text-stone-900 shadow-sm"
              : isDark 
                ? "text-stone-400 hover:text-stone-300 hover:bg-stone-650" 
                : "text-stone-600 hover:text-stone-700 hover:bg-stone-200/50"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
} 