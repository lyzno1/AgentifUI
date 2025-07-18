'use client';

import { cn } from '@lib/utils';
// 移除 useTheme 和 useThemeColors 的导入，使用 CSS 变量替代
import { motion } from 'framer-motion';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import React from 'react';

// 仅导入 motion

/**
 * ThinkBlock 内容容器的属性接口
 */
interface ThinkBlockContentProps {
  // 要显示的 Markdown 内容
  markdownContent: string;
  // 控制内容是否显示
  isOpen: boolean; // 仍然需要这个属性，用于动画状态切换
}

/**
 * ThinkBlock 的内容显示容器
 * 使用 ReactMarkdown 渲染内容
 * 针对打开和关闭提供丝滑的动画效果
 */
export const ThinkBlockContent: React.FC<ThinkBlockContentProps> = ({
  markdownContent,
  isOpen,
}) => {
  // 移除 useTheme 和 useThemeColors，使用 CSS 变量替代

  // 预处理内容，转义自定义HTML标签以避免浏览器解析错误
  // 类似于代码块的处理方式，让不认识的标签显示为文本
  const preprocessContent = (content: string): string => {
    // 定义已知的安全HTML标签白名单
    const knownHtmlTags = new Set([
      'div',
      'span',
      'p',
      'br',
      'hr',
      'strong',
      'em',
      'b',
      'i',
      'u',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'blockquote',
      'pre',
      'code',
      'a',
      'img',
      'sub',
      'sup',
      'mark',
      'del',
      'ins',
    ]);

    // 转义不在白名单中的HTML标签，让它们显示为文本
    return content
      .replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
        if (!knownHtmlTags.has(tagName.toLowerCase())) {
          return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        return match;
      })
      .replace(/<\/([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
        if (!knownHtmlTags.has(tagName.toLowerCase())) {
          return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        return match;
      });
  };

  const processedContent = preprocessContent(markdownContent);

  // --- Markdown 渲染器的组件配置 ---
  const markdownComponents: Components = {
    code({ className, children, ...props }: any) {
      // const match = /language-(\w+)/.exec(className || '');
      // 如果不是带有语言标识的代码块 (inline code)
      return !className?.includes('language-') ? (
        <code
          className="rounded px-2 py-1 font-mono"
          style={{
            backgroundColor: 'var(--md-think-inline-code-bg)',
            color: 'var(--md-think-inline-code-text)',
          }}
          {...props}
        >
          {children}
        </code>
      ) : (
        // 如果是带有语言标识的代码块
        <pre
          className="my-4 overflow-auto rounded-md border p-5"
          style={{
            backgroundColor: 'var(--md-code-bg)',
            color: 'var(--md-code-text)',
            borderColor: 'var(--md-code-border)',
          }}
        >
          <code
            className={cn(className, 'block text-base whitespace-pre-wrap')}
            {...props}
          >
            {children}
          </code>
        </pre>
      );
    },

    // 表格渲染
    table({ className, children, ...props }: any) {
      return (
        <div
          className="my-5 w-full overflow-x-auto rounded-md border"
          style={{
            borderColor: 'var(--md-table-border)',
          }}
        >
          <table
            className="min-w-full divide-y"
            style={{
              borderColor: 'var(--md-table-border)',
              // CSS 没有 divideColor 属性，使用类名设置分隔线颜色
            }}
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },

    // 表头单元格样式
    th({ className, children, ...props }: any) {
      return (
        <th
          className="px-5 py-3 text-left text-base font-medium"
          style={{
            backgroundColor: 'var(--md-table-header-bg)',
            color: 'var(--md-table-header-text)',
          }}
          {...props}
        >
          {children}
        </th>
      );
    },

    // 表格数据单元格样式
    td({ className, children, ...props }: any) {
      return (
        <td
          className="border-t px-5 py-3 text-base"
          style={{
            borderColor: 'var(--md-table-divide)',
            color: 'var(--md-table-cell-text)',
          }}
          {...props}
        >
          {children}
        </td>
      );
    },

    // 引用块样式
    blockquote({ className, children, ...props }: any) {
      return (
        <blockquote
          className="my-5 border-l-4 py-3 pl-5"
          style={{
            backgroundColor: 'var(--md-blockquote-bg)',
            borderColor: 'var(--md-blockquote-border)',
            color: 'var(--md-blockquote-text)',
          }}
          {...props}
        >
          {children}
        </blockquote>
      );
    },

    // 段落样式 - 完全去除段落间的间距，使其与普通换行一样
    p({ className, children, ...props }: any) {
      return (
        <p
          className="my-0 text-base leading-relaxed" // 完全去除上下外边距
          style={{
            color: 'var(--md-think-content-text)',
          }}
          {...props}
        >
          {children}
        </p>
      );
    },

    // 标题样式
    h1({ className, children, ...props }: any) {
      return (
        <h1
          className="my-5 text-2xl font-bold"
          style={{
            color: 'var(--md-think-content-text)',
          }}
          {...props}
        >
          {children}
        </h1>
      );
    },

    h2({ className, children, ...props }: any) {
      return (
        <h2
          className="my-4 text-xl font-bold"
          style={{
            color: 'var(--md-think-content-text)',
          }}
          {...props}
        >
          {children}
        </h2>
      );
    },

    h3({ className, children, ...props }: any) {
      return (
        <h3
          className="my-3 text-lg font-semibold"
          style={{
            color: 'var(--md-think-content-text)',
          }}
          {...props}
        >
          {children}
        </h3>
      );
    },

    // 列表样式
    ul({ className, children, ...props }: any) {
      return (
        <ul
          className="my-4 list-disc space-y-2 pl-6 text-base"
          style={{
            color: 'var(--md-think-content-text)',
          }}
          {...props}
        >
          {children}
        </ul>
      );
    },

    ol({ className, children, ...props }: any) {
      return (
        <ol
          className="my-4 list-decimal space-y-2 pl-6 text-base"
          style={{
            color: 'var(--md-think-content-text)',
          }}
          {...props}
        >
          {children}
        </ol>
      );
    },

    // 链接样式
    a({ className, children, node, ...props }: any) {
      // 检查链接是否包含图片：如果包含图片，将其渲染为图片链接样式
      // 避免嵌套 <a> 标签导致的 HTML 错误
      const hasImageChild = node?.children?.some(
        (child: any) => child.tagName === 'img'
      );

      if (hasImageChild) {
        // 如果链接包含图片，使用特殊的图片链接样式
        const imageChild = node.children.find(
          (child: any) => child.tagName === 'img'
        );
        const alt = imageChild?.properties?.alt || '图片链接';

        return (
          <a
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm no-underline"
            style={{
              borderColor: 'var(--md-think-content-border)',
              backgroundColor: 'var(--md-think-content-bg)',
              color: 'var(--md-think-content-text)',
              opacity: 0.9,
            }}
            target="_blank"
            rel="noopener noreferrer"
            title={`点击查看: ${alt}`}
            {...props}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {alt}
          </a>
        );
      }

      // 普通链接的处理
      return (
        <a
          className="underline"
          style={{
            color: 'var(--md-think-content-text)',
            opacity: 0.9,
          }}
          {...props}
        >
          {children}
        </a>
      );
    },

    // 图片处理：将图片渲染为链接形式，避免加载抖动问题
    // 如果图片在链接内，由 a 组件统一处理，这里返回 null 避免重复渲染
    img({ src, alt, node, ...props }: any) {
      // 确保src是字符串类型
      const imageUrl = typeof src === 'string' ? src : '';

      // 检查是否在链接内部（由父级 a 组件处理）
      const isInsideLink = node?.parent?.tagName === 'a';

      if (isInsideLink) {
        // 如果在链接内，返回 null，由父级 a 组件处理
        return null;
      }

      // 独立的图片，创建图片链接
      return (
        <a
          href={imageUrl}
          className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm"
          style={{
            borderColor: 'var(--md-think-content-border)',
            backgroundColor: 'var(--md-think-content-bg)',
            color: 'var(--md-think-content-text)',
            opacity: 0.9,
          }}
          target="_blank"
          rel="noopener noreferrer"
          title={alt || '查看图片'}
          {...props}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {alt || '图片链接'}
        </a>
      );
    },
  };

  // --- 优化后的动画变体 ---
  const variants = {
    open: {
      opacity: 1,
      height: 'auto',
      scale: 1,
      y: 0,
      transition: {
        type: 'spring', // 使用弹簧动画
        stiffness: 300, // 弹性系数
        damping: 24, // 阻尼系数，值越大动画越快结束
        mass: 0.8, // 质量，值越小动画越快
        height: { type: 'spring', stiffness: 100, damping: 30 }, // 高度使用更缓和的弹簧
      },
    },
    closed: {
      opacity: 0,
      height: 0,
      scale: 0.95,
      y: -8,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        height: { delay: 0.1, type: 'spring', stiffness: 200, damping: 30 }, // 稍延迟高度变化
      },
    },
  };

  return (
    <motion.div
      className="mb-2 origin-top overflow-hidden" // 添加 origin-top 并将 margin-bottom 移到这里
      initial={false} // 不使用 initial，避免首次渲染闪烁
      animate={isOpen ? 'open' : 'closed'} // 根据 isOpen 切换状态
      variants={variants}
    >
      <div
        id="think-block-content"
        className="think-block-content markdown-body w-full max-w-full flex-1 transform-gpu rounded-md border p-5 font-serif text-base"
        style={{
          backgroundColor: 'var(--md-think-content-bg)',
          borderColor: 'var(--md-think-content-border)',
          color: 'var(--md-think-content-text)',
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={markdownComponents}
          children={processedContent}
        />
      </div>
    </motion.div>
  );
};
