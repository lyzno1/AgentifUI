"use client"

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useSupabaseAuth } from "@lib/supabase/hooks"
import { useCurrentApp } from '@lib/hooks/use-current-app'
import { cn, formatBytes } from '@lib/utils'
import { Upload, X, File, CheckCircle2Icon, RotateCcw, AlertCircle } from 'lucide-react'
import { Spinner } from "@components/ui/spinner"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import { uploadDifyFile } from "@lib/services/dify/file-service"
import type { DifyFileUploadResponse } from "@lib/services/dify/types"

// --- BEGIN COMMENT ---
// 定义上传文件的状态接口，与聊天输入组件保持一致
// --- END COMMENT ---
interface UploadFile {
  id: string // 本地生成的唯一ID
  file: File // 原始 File 对象
  name: string // 文件名
  size: number // 文件大小
  type: string // 文件类型 (MIME type)
  status: "pending" | "uploading" | "success" | "error" // 上传状态
  progress: number // 上传进度 (0-100)
  error?: string // 错误信息
  uploadedId?: string // 上传成功后 Dify 返回的文件 ID
}

interface FileUploadFieldProps {
  config: any
  value: any[] | any // 支持单文件对象或文件数组
  onChange: (files: any[] | any) => void // 返回Dify格式的文件对象或数组
  error?: string
  label?: string
  instanceId: string // 添加instanceId用于Dify API调用
  isSingleFileMode?: boolean // 是否为单文件模式
}

/**
 * 工作流文件上传字段组件 - 集成Dify文件上传API
 * 
 * 功能特点：
 * - 集成Dify文件上传API
 * - 实时上传进度显示
 * - 支持重试上传
 * - 文件状态管理
 * - 与聊天输入组件的文件上传功能保持一致
 */
export function FileUploadField({ config, value, onChange, error, label, instanceId, isSingleFileMode = false }: FileUploadFieldProps) {
  const { isDark } = useTheme()
  const { session } = useSupabaseAuth()
  const { currentAppId } = useCurrentApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // --- BEGIN COMMENT ---
  // 本地文件状态管理，用于跟踪上传状态
  // --- END COMMENT ---
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  
  // --- BEGIN COMMENT ---
  // 当外部value prop发生变化时，同步uploadFiles状态
  // 支持表单重置时清空文件列表
  // --- END COMMENT ---
  useEffect(() => {
    // 如果value为空（null、undefined、空数组），清空文件列表
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setUploadFiles([])
      return
    }
    
    // 处理单文件对象的情况
    const valueArray = Array.isArray(value) ? value : [value]
    
    if (valueArray.length > 0) {
      // 检查value是否已经是处理过的Dify文件格式
      const isProcessedFiles = valueArray.every((item: any) => 
        typeof item === 'object' && item.upload_file_id
      )
    
      if (!isProcessedFiles) {
        // 如果是原始File对象数组，转换为UploadFile格式
        const convertedFiles = valueArray.map((file: File) => ({
          id: `${file.name}-${file.lastModified}-${file.size}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "pending" as const,
          progress: 0
        }))
        setUploadFiles(convertedFiles)
      }
    }
  }, [value])
  
  // --- BEGIN COMMENT ---
  // 用ref跟踪上次的成功文件ID列表，避免无限循环
  // --- END COMMENT ---
  const lastSuccessIdsRef = useRef('')
  
  // --- BEGIN COMMENT ---
  // 当uploadFiles状态变化时，通知父组件
  // 根据number_limits决定返回单个文件对象还是文件数组
  // --- END COMMENT ---
  useEffect(() => {
    const successfulFiles = uploadFiles
      .filter(file => file.status === 'success' && file.uploadedId)
      .map(file => ({
        type: getDifyFileType(file),
        transfer_method: 'local_file' as const,
        upload_file_id: file.uploadedId as string,
      }))
    
    // 只有在成功文件列表实际发生变化时才调用onChange
    const currentSuccessIds = successfulFiles.map(f => f.upload_file_id).sort().join(',')
    
    if (lastSuccessIdsRef.current !== currentSuccessIds) {
      lastSuccessIdsRef.current = currentSuccessIds
      
      // --- BEGIN COMMENT ---
      // 根据isSingleFileMode判断是单文件还是多文件
      // --- END COMMENT ---
      if (isSingleFileMode) {
        // 单文件模式：返回第一个文件对象或null
        const singleFile = successfulFiles.length > 0 ? successfulFiles[0] : null
        onChange(singleFile)
      } else {
        // 多文件模式：返回文件数组
        onChange(successfulFiles)
      }
    }
  }, [uploadFiles, isSingleFileMode]) // 添加isSingleFileMode依赖
  
  // --- BEGIN COMMENT ---
  // 根据文件类型推断 Dify 文件 type 字段
  // --- END COMMENT ---
  const getDifyFileType = (file: UploadFile): 'image' | 'document' | 'audio' | 'video' | 'custom' => {
    const mime = file.type.toLowerCase()
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime.startsWith('video/')) return 'video'
    if (mime === 'application/pdf' || mime.includes('word') || mime.includes('excel') || mime.includes('csv') || mime.includes('text') || mime.includes('html') || mime.includes('xml') || mime.includes('epub') || mime.includes('powerpoint')) return 'document'
    return 'custom'
  }
  
  // --- BEGIN COMMENT ---
  // 更新文件状态的辅助函数
  // --- END COMMENT ---
  const updateFileStatus = useCallback((id: string, status: UploadFile["status"], progress?: number, error?: string, uploadedId?: string) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === id ? {
        ...file,
        status,
        progress: progress ?? file.progress,
        error: status === 'error' ? error : undefined,
        uploadedId: status === 'success' ? uploadedId : file.uploadedId
      } : file
    ))
  }, [])
  
  // --- BEGIN COMMENT ---
  // 上传单个文件到Dify - 使用当前应用ID，与聊天输入框保持一致
  // --- END COMMENT ---
  const uploadFileToDify = useCallback(async (uploadFile: UploadFile) => {
    const userIdToUse = session?.user?.id || 'workflow-user-id'
    
    try {
      updateFileStatus(uploadFile.id, 'uploading', 0)
      
      // --- BEGIN COMMENT ---
      // 使用当前应用ID，如果没有则fallback到instanceId
      // 与聊天输入框的逻辑保持一致
      // --- END COMMENT ---
      const appIdToUse = currentAppId || instanceId
      
      const response = await uploadDifyFile(
        appIdToUse,
        uploadFile.file,
        userIdToUse,
        (progress) => {
          updateFileStatus(uploadFile.id, 'uploading', progress)
        }
      )
      
      updateFileStatus(uploadFile.id, 'success', 100, undefined, response.id)
      
    } catch (error) {
      const errorMessage = (error as Error).message || '上传失败'
      updateFileStatus(uploadFile.id, 'error', undefined, errorMessage)
      console.error(`[工作流文件上传] 上传失败: ${uploadFile.name}`, error)
    }
  }, [currentAppId, instanceId, session?.user?.id, updateFileStatus])
  
  // --- BEGIN COMMENT ---
  // 处理文件选择
  // --- END COMMENT ---
  const handleFileSelect = useCallback((newFiles: File[]) => {
    const newUploadFiles = newFiles.map(file => {
      const uploadFile: UploadFile = {
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "pending",
        progress: 0
      }
      
      // 立即开始上传
      setTimeout(() => uploadFileToDify(uploadFile), 100)
      
      return uploadFile
    })
    
    setUploadFiles(prev => [...prev, ...newUploadFiles])
  }, [uploadFileToDify])
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files)
      // 重置输入框
      e.target.value = ''
    }
  }
  
  const handleRemoveFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id))
  }
  
  // --- BEGIN COMMENT ---
  // 重试上传
  // --- END COMMENT ---
  const handleRetryUpload = useCallback((id: string) => {
    const uploadFile = uploadFiles.find(file => file.id === id)
    if (uploadFile && uploadFile.status === 'error') {
      uploadFileToDify(uploadFile)
    }
  }, [uploadFiles, uploadFileToDify])
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  // 文件上传字段默认启用，除非明确设置为false
  if (config?.enabled === false) {
    return null
  }
  
  // --- BEGIN COMMENT ---
  // 计算状态统计
  // --- END COMMENT ---
  const isUploading = uploadFiles.some(f => f.status === 'uploading')
  const hasError = uploadFiles.some(f => f.status === 'error')
  const successCount = uploadFiles.filter(f => f.status === 'success').length
  // --- BEGIN COMMENT ---
  // 根据isSingleFileMode和配置确定最大文件数
  // file-list类型使用max_length字段，file类型使用number_limits字段
  // --- END COMMENT ---
  const maxFiles = isSingleFileMode ? 1 : (config.max_length || config.number_limits || 1)
  const canUploadMore = uploadFiles.length < maxFiles
  
  // --- BEGIN COMMENT ---
  // 根据Dify文件类型标识符生成文件类型提示和accept字符串
  // 参考file-type-selector.tsx的逻辑
  // --- END COMMENT ---
  const getFileTypeInfo = () => {
    const types = config.allowed_file_types
    if (!types || types.length === 0) {
      return {
        hint: '支持上传各种文件类型',
        accept: undefined
      }
    }
    
    const typeMap: Record<string, { name: string; accept: string }> = {
      'image': { 
        name: '图片', 
        accept: 'image/*,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.ico,.tiff,.tif'
      },
      'document': { 
        name: '文档', 
        accept: ".txt,.md,.mdx,.markdown,.pdf,.html,.xlsx,.xls,.doc,.docx,.csv,.eml,.msg,.pptx,.ppt,.xml,.epub"
      },
      'audio': { 
        name: '音频', 
        accept: 'audio/*,.mp3,.wav,.flac,.aac,.ogg,.wma,.m4a,.opus'
      },
      'video': { 
        name: '视频', 
        accept: 'video/*,.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm,.m4v,.3gp'
      },
      'custom': { name: '其他文件', accept: '*/*' }
    }
    
    const supportedTypes = types.map((type: string) => typeMap[type]?.name || type).filter(Boolean)
    const acceptStrings = types.map((type: string) => typeMap[type]?.accept).filter(Boolean)
    
    return {
      hint: supportedTypes.length > 0 ? `支持上传：${supportedTypes.join('、')}` : '支持上传各种文件类型',
      accept: acceptStrings.length > 0 ? acceptStrings.join(',') : undefined
    }
  }
  
  const fileTypeInfo = getFileTypeInfo()
  
  // 生成文件大小提示文本
  const getFileSizeHint = () => {
    const maxSize = config.max_file_size_mb
    if (maxSize) {
      return `单个文件最大 ${maxSize}MB`
    }
    return ''
  }
  
  return (
    <div className="space-y-4">
      {/* 标签 */}
      {label && (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            "bg-gradient-to-r from-stone-500 to-stone-400"
          )} />
          <label className={cn(
            "text-sm font-semibold font-serif",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            {label}
            {successCount > 0 && (
              <span className={cn(
                "ml-2 px-2 py-1 rounded-full text-xs",
                isDark 
                  ? "bg-stone-700 text-stone-400"
                  : "bg-stone-100 text-stone-600"
              )}>
                {successCount}/{maxFiles} 已上传
              </span>
            )}
          </label>
        </div>
      )}
      
      {/* 上传区域 */}
      {canUploadMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "group relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
            "transition-all duration-300 ease-in-out backdrop-blur-sm",
            "hover:scale-[1.01] hover:shadow-lg",
            isDark 
              ? "bg-gradient-to-br from-stone-800/80 to-stone-700/80"
              : "bg-gradient-to-br from-white/80 to-stone-50/80",
            error
              ? "border-red-400 hover:border-red-300" + (isDark ? " bg-red-900/10" : " bg-red-50/50")
              : isDark
                ? "border-stone-600 hover:border-stone-500"
                : "border-stone-300 hover:border-stone-400",
            isUploading && "opacity-75 cursor-not-allowed"
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {/* 背景装饰 */}
          <div className={cn(
            "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100",
            "transition-opacity duration-300",
            isDark 
              ? "bg-gradient-to-br from-stone-700/50 to-stone-600/50"
              : "bg-gradient-to-br from-stone-100/50 to-stone-200/50"
          )} />
          
          <div className="relative z-10 space-y-4">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl",
              "shadow-lg group-hover:scale-110 transition-transform duration-300",
              isDark 
                ? "bg-gradient-to-br from-stone-700 to-stone-600 border border-stone-600/50 shadow-stone-900/50"
                : "bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-300/50 shadow-stone-200/50"
            )}>
              <Upload className={cn(
                "h-7 w-7",
                isDark ? "text-stone-300" : "text-stone-600"
              )} />
            </div>
            
            <div className="space-y-2">
              <p className={cn(
                "text-base font-semibold font-serif",
                isDark ? "text-stone-200" : "text-stone-800"
              )}>
                {isUploading ? "正在上传文件..." : "拖拽文件到此处或点击上传"}
              </p>
              
              <div className={cn(
                "text-sm font-serif space-y-1",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                <p>最多上传 {maxFiles} 个文件 (剩余 {maxFiles - uploadFiles.length} 个)</p>
                <p>{fileTypeInfo.hint}</p>
                {getFileSizeHint() && <p>{getFileSizeHint()}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 超出限制提示 */}
      {uploadFiles.length >= maxFiles && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg",
          isDark 
            ? "bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-700/50 shadow-amber-900/20"
            : "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200 shadow-amber-100/50"
        )}>
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <p className={cn(
            "text-sm font-serif",
            isDark ? "text-amber-300" : "text-amber-700"
          )}>
            已达到最大文件数量限制 ({uploadFiles.length}/{maxFiles})
          </p>
        </div>
      )}
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={fileTypeInfo.accept}
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isUploading || !canUploadMore}
      />
      
      {/* 已选文件列表 */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
              isDark ? "via-stone-600" : "via-stone-300"
            )} />
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-serif border",
              isDark 
                ? "bg-stone-800 text-stone-400 border-stone-700"
                : "bg-stone-100 text-stone-600 border-stone-200"
            )}>
              已选文件
            </span>
            <div className={cn(
              "flex-1 h-px bg-gradient-to-r from-transparent to-transparent",
              isDark ? "via-stone-600" : "via-stone-300"
            )} />
          </div>
          
          <div className="grid gap-3">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-xl border",
                  "transition-all duration-300 ease-in-out backdrop-blur-sm hover:shadow-lg",
                  "animate-in slide-in-from-top-2 fade-in duration-300",
                  isDark 
                    ? "bg-gradient-to-r from-stone-800/90 to-stone-700/90"
                    : "bg-gradient-to-r from-white/90 to-stone-50/90",
                  uploadFile.status === 'success' && (isDark ? "border-green-700/50" : "border-green-200"),
                  uploadFile.status === 'error' && (isDark ? "border-red-700/50" : "border-red-200"),
                  uploadFile.status === 'uploading' && (isDark ? "border-stone-500/50" : "border-stone-400"),
                  uploadFile.status === 'pending' && (isDark ? "border-stone-600" : "border-stone-200")
                )}
              >
                {/* 状态指示器 */}
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    uploadFile.status === 'success' && (isDark ? "bg-green-900/30" : "bg-green-100"),
                    uploadFile.status === 'error' && (isDark ? "bg-red-900/30" : "bg-red-100"),
                    uploadFile.status === 'uploading' && (isDark ? "bg-stone-700/50" : "bg-stone-200"),
                    uploadFile.status === 'pending' && (isDark ? "bg-stone-700" : "bg-stone-100")
                  )}>
                    {uploadFile.status === 'uploading' && <Spinner size="sm" />}
                    {uploadFile.status === 'success' && (
                      <CheckCircle2Icon className={cn(
                        "w-5 h-5",
                        isDark ? "text-green-400" : "text-green-600"
                      )} />
                    )}
                    {uploadFile.status === 'error' && (
                      <TooltipWrapper content="重新上传" placement="top" id={`retry-${uploadFile.id}`}>
                        <button 
                          type="button"
                          onClick={() => handleRetryUpload(uploadFile.id)}
                          className={cn(
                            "w-full h-full flex items-center justify-center rounded-xl",
                            "focus:outline-none transition-colors duration-200",
                            isDark 
                              ? "text-red-400 hover:bg-red-800/50"
                              : "text-red-600 hover:bg-red-200"
                          )}
                          aria-label="重试上传"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </TooltipWrapper>
                    )}
                    {uploadFile.status === 'pending' && (
                      <File className={cn(
                        "w-5 h-5",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )} />
                    )}
                  </div>
                  
                  {/* 脉冲动画（上传中） */}
                  {uploadFile.status === 'uploading' && (
                    <div className="absolute inset-0 rounded-xl border-2 border-stone-400 animate-ping opacity-30" />
                  )}
                </div>
                
                {/* 文件信息 */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className={cn(
                    "text-sm font-semibold font-serif truncate",
                    isDark ? "text-stone-200" : "text-stone-800"
                  )}>
                    {uploadFile.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-mono px-2 py-1 rounded-full",
                      isDark 
                        ? "bg-stone-700 text-stone-400"
                        : "bg-stone-100 text-stone-600"
                    )}>
                      {formatBytes(uploadFile.size)}
                    </span>
                    
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <span className={cn(
                        "text-xs font-serif",
                        isDark ? "text-red-400" : "text-red-600"
                      )}>
                        {uploadFile.error}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 删除按钮 */}
                <TooltipWrapper content="移除文件" placement="top" id={`remove-${uploadFile.id}`}>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(uploadFile.id)}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100",
                      isDark 
                        ? "hover:bg-stone-600 text-stone-400 hover:text-stone-200"
                        : "hover:bg-stone-200 text-stone-500 hover:text-stone-700"
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </TooltipWrapper>
                
                {/* 上传进度条 */}
                {uploadFile.status === 'uploading' && (
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden",
                    isDark ? "bg-stone-700" : "bg-stone-200"
                  )}>
                    <div 
                      className="h-full bg-gradient-to-r from-stone-500 to-stone-400 transition-all duration-300 rounded-b-xl"
                      style={{ width: `${uploadFile.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border shadow-lg",
          isDark 
            ? "bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-700/50 shadow-red-900/20"
            : "bg-gradient-to-r from-red-50 to-red-100/50 border-red-200 shadow-red-100/50"
        )}>
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <p className={cn(
            "text-sm font-serif",
            isDark ? "text-red-300" : "text-red-700"
          )}>{error}</p>
        </div>
      )}
    </div>
  )
} 