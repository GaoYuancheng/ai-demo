import { XMarkdown } from '@ant-design/x-markdown';
import { memo } from 'react';

/**
 * Markdown 渲染组件属性
 */
interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string;
  /** 是否为流式输出 */
  isStreaming?: boolean;
}

/**
 * Markdown 渲染组件
 * 
 * 使用 @ant-design/x-markdown 渲染 AI 返回的 Markdown 格式文本
 * 支持代码高亮、表格、列表等 Markdown 语法
 * 
 * @param content - Markdown 内容
 * @param isStreaming - 是否为流式输出（用于显示加载状态）
 * @returns 渲染后的 React 元素
 */
const MarkdownRenderer = memo<MarkdownRendererProps>(function MarkdownRenderer({ 
  content, 
  isStreaming = false 
}) {
  return (
    <XMarkdown 
      content={content}
      streaming={{
        hasNextChunk: isStreaming,
      }}
    />
  );
});

export default MarkdownRenderer;
