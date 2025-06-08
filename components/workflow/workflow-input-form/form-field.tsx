"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { CustomSelect } from './custom-select'
import { FileUploadField } from './file-upload-field'
import type { DifyTextInputControl, DifyNumberInputControl, DifyParagraphControl, DifySelectControl, DifyFileInputControl } from '@lib/services/dify/types'

interface FormFieldProps {
  type: 'text-input' | 'number' | 'paragraph' | 'select' | 'file' | 'file-list'
  config: DifyTextInputControl | DifyNumberInputControl | DifyParagraphControl | DifySelectControl | DifyFileInputControl
  value: any
  onChange: (value: any) => void
  error?: string
  instanceId?: string // 添加instanceId用于文件上传
}

/**
 * 通用表单字段组件
 * 
 * 支持的字段类型：
 * - text-input: 单行文本输入
 * - number: 数字输入
 * - paragraph: 多行文本输入
 * - select: 下拉选择
 * - file: 文件上传
 */
export function FormField({ type, config, value, onChange, error, instanceId }: FormFieldProps) {
  const { isDark } = useTheme()
  
  const baseInputClasses = cn(
    "w-full px-4 py-3 rounded-xl border-2 font-serif transition-all duration-300",
    "focus:outline-none focus:ring-4 focus:ring-stone-500/20 focus:border-stone-500",
    "focus:shadow-lg focus:shadow-stone-500/25 backdrop-blur-sm",
    error
      ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" + (isDark ? " bg-red-900/10" : " bg-red-50/50")
      : isDark
        ? "bg-stone-800/90 border-stone-600 text-stone-100 placeholder-stone-400 hover:border-stone-500"
        : "bg-white/90 border-stone-300 text-stone-900 placeholder-stone-500 hover:border-stone-400"
  )
  
  const labelClasses = cn(
    "flex items-center gap-2 text-sm font-semibold font-serif mb-3",
    isDark ? "text-stone-200" : "text-stone-800"
  )
  
  const errorClasses = cn(
    "mt-2 flex items-center gap-2",
    isDark ? "text-red-400" : "text-red-600"
  )
  
  const renderInput = () => {
    switch (type) {
      case 'text-input':
        const textConfig = config as DifyTextInputControl
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`请输入${config.label}`}
            maxLength={textConfig.max_length || undefined}
            className={baseInputClasses}
          />
        )
      
      case 'number':
        const numberConfig = config as DifyNumberInputControl
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const inputValue = e.target.value
              console.log(`[FormField-${config.variable}] 用户输入:`, inputValue, '(类型:', typeof inputValue, ')')
              
              // 如果输入为空，传递空字符串
              if (inputValue === '') {
                console.log(`[FormField-${config.variable}] 输入为空，传递空字符串`)
                onChange('')
                return
              }
              
              // 尝试转换为数字
              const numValue = parseFloat(inputValue)
              console.log(`[FormField-${config.variable}] parseFloat结果:`, numValue, '(类型:', typeof numValue, ')')
              
              if (!isNaN(numValue)) {
                console.log(`[FormField-${config.variable}] 传递数字值:`, numValue)
                onChange(numValue)
              } else {
                // 如果转换失败，保持原始字符串（用于验证）
                console.log(`[FormField-${config.variable}] 转换失败，保持字符串:`, inputValue)
                onChange(inputValue)
              }
            }}
            placeholder={`请输入${config.label}`}
            min={numberConfig.min}
            max={numberConfig.max}
            step={numberConfig.step || 1}
            className={baseInputClasses}
          />
        )
      
      case 'paragraph':
        const paragraphConfig = config as DifyParagraphControl
        const hasMaxLength = (paragraphConfig as any).max_length
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`请输入${config.label}`}
            rows={6}
            maxLength={hasMaxLength || undefined}
            className={cn(
              baseInputClasses, 
              "resize-none",
              hasMaxLength ? "pb-8" : "" // 为字符计数器留出空间
            )}
          />
        )
      
      case 'select':
        const selectConfig = config as DifySelectControl
        return (
          <CustomSelect
            value={value}
            onChange={onChange}
            options={selectConfig.options}
            placeholder={`请选择${config.label}`}
            error={error}
          />
        )
      
      case 'file':
        const fileConfig = config as any
        if (!instanceId) {
          console.warn('[FormField] file类型字段需要instanceId参数')
          return null
        }
        return (
          <FileUploadField
            config={{
              ...fileConfig, // 保留所有原始字段
              enabled: true // 确保启用
            }}
            value={value || []}
            onChange={onChange}
            error={error}
            instanceId={instanceId}
            isSingleFileMode={true} // 单文件模式
          />
        )
      
      case 'file-list':
        const fileListConfig = config as any
        if (!instanceId) {
          console.warn('[FormField] file-list类型字段需要instanceId参数')
          return null
        }
        return (
          <FileUploadField
            config={{
              ...fileListConfig, // 保留所有原始字段
              enabled: true // 确保启用
            }}
            value={value || []}
            onChange={onChange}
            error={error}
            instanceId={instanceId}
            isSingleFileMode={false} // 多文件模式
          />
        )
      
      default:
        return null
    }
  }
  
  // --- BEGIN COMMENT ---
  // 为number类型生成范围提示信息
  // --- END COMMENT ---
  const getNumberHint = () => {
    if (type !== 'number') return null
    
    const numberConfig = config as DifyNumberInputControl
    const hints: string[] = []
    
    if (numberConfig.min !== undefined && numberConfig.max !== undefined) {
      hints.push(`范围：${numberConfig.min} - ${numberConfig.max}`)
    } else if (numberConfig.min !== undefined) {
      hints.push(`最小值：${numberConfig.min}`)
    } else if (numberConfig.max !== undefined) {
      hints.push(`最大值：${numberConfig.max}`)
    }
    
    if (numberConfig.step && numberConfig.step !== 1) {
      hints.push(`步长：${numberConfig.step}`)
    }
    
    if (numberConfig.precision !== undefined) {
      hints.push(`小数位数：${numberConfig.precision}`)
    }
    
    return hints.length > 0 ? hints.join('，') : null
  }
  
  return (
    <div className="space-y-1">
      <label className={labelClasses}>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          "bg-gradient-to-r from-stone-500 to-stone-400"
        )} />
        {config.label}
        {config.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      
      <div className="relative">
        {renderInput()}
        
        {/* 字符计数（仅对有长度限制的字段显示） */}
        {(type === 'text-input' || type === 'paragraph') && (config as any).max_length && (
          <div className={cn(
            "absolute bottom-3 right-4 text-xs font-mono transition-opacity duration-200",
            isDark ? "text-stone-500" : "text-stone-400",
            (value || '').length > 0 ? "opacity-100" : "opacity-0"
          )}>
            {(value || '').length} / {(config as any).max_length}
          </div>
        )}
      </div>
      
      {/* 数字类型的范围提示 */}
      {type === 'number' && getNumberHint() && (
        <div className={cn(
          "text-xs font-serif",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          {getNumberHint()}
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className={errorClasses}>
          <div className="w-1 h-1 rounded-full bg-red-500" />
          <span className="text-sm font-serif">{error}</span>
        </div>
      )}
    </div>
  )
} 