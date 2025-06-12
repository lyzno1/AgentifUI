"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CustomSelect({ 
  value, 
  options, 
  onChange, 
  placeholder = "请选择...",
  className 
}: CustomSelectProps) {
  const { isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  
  // --- BEGIN COMMENT ---
  // 点击外部关闭下拉框
  // --- END COMMENT ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div ref={selectRef} className={cn("relative", className)}>
      {/* --- BEGIN COMMENT ---
      选择器触发按钮
      --- END COMMENT --- */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 rounded-lg border text-sm transition-colors text-left flex items-center justify-between",
          isDark 
            ? "bg-stone-700 border-stone-600 text-stone-100 hover:border-stone-500" 
            : "bg-white border-stone-300 text-stone-900 hover:border-stone-400",
          isOpen && (isDark ? "border-stone-500" : "border-stone-400")
        )}
      >
        <span className={cn(
          selectedOption ? "text-inherit" : "text-stone-500"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180",
          isDark ? "text-stone-400" : "text-stone-500"
        )} />
      </button>

      {/* --- BEGIN COMMENT ---
      下拉选项列表
      --- END COMMENT --- */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 max-h-60 overflow-y-auto",
          isDark 
            ? "bg-stone-700 border-stone-600" 
            : "bg-white border-stone-300"
        )}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                "w-full px-3 py-2 text-sm text-left transition-colors flex items-center justify-between",
                "first:rounded-t-lg last:rounded-b-lg",
                value === option.value
                  ? isDark 
                    ? "bg-stone-600 text-stone-100" 
                    : "bg-stone-100 text-stone-900"
                  : isDark
                    ? "text-stone-200 hover:bg-stone-600"
                    : "text-stone-700 hover:bg-stone-50"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className={cn(
                  "h-4 w-4",
                  isDark ? "text-stone-300" : "text-stone-600"
                )} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 