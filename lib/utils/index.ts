import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 合并className的工具函数
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化字节数为可读的文件大小
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// 🎯 提取助手消息的主要内容，移除推理文本（think和details标签）
// 与前端的extractMainContentForCopy保持完全一致的逻辑
// 用于生成对话预览时过滤掉推理过程，只显示真正的回答内容
export function extractMainContentForPreview(rawContent: string): string {
  // 检查是否有未闭合的关键标签
  const openThinkCount = (rawContent.match(/<think(?:\s[^>]*)?>/gi) || []).length;
  const closeThinkCount = (rawContent.match(/<\/think>/gi) || []).length;
  const openDetailsCount = (rawContent.match(/<details(?:\s[^>]*)?>/gi) || []).length;
  const closeDetailsCount = (rawContent.match(/<\/details>/gi) || []).length;
  
  // 如果有未闭合的标签，说明内容还在生成中，返回空字符串
  if (openThinkCount > closeThinkCount || openDetailsCount > closeDetailsCount) {
    return '';
  }
  
  let cleanContent = rawContent;
  
  // 移除所有 <think>...</think> 块
  const thinkRegex = /<think(?:\s[^>]*)?>[\s\S]*?<\/think>/gi;
  cleanContent = cleanContent.replace(thinkRegex, '');
  
  // 移除所有 <details>...</details> 块
  const detailsRegex = /<details(?:\s[^>]*)?>[\s\S]*?<\/details>/gi;
  cleanContent = cleanContent.replace(detailsRegex, '');
  
  // 清理多余的空白字符
  return cleanContent.replace(/\n\s*\n/g, '\n').trim();
} 