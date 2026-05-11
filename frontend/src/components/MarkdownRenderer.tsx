import { XMarkdown } from "@ant-design/x-markdown";
import { memo, useMemo } from "react";
import MarkdownChart from "./MarkdownChart";

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
 * 代码块信息接口
 */
interface CodeBlockInfo {
  language: string;
  code: string;
  fullMatch: string;
}

/**
 * 提取代码块信息
 *
 * 从 Markdown 内容中提取所有代码块
 *
 * @param content - Markdown 内容
 * @returns 代码块信息数组
 */
function extractCodeBlocks(content: string): CodeBlockInfo[] {
  const codeBlockRegex = /```(\w+)(?:\n|\s)?([\s\S]*?)```/g;
  const blocks: CodeBlockInfo[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1].toLowerCase(),
      code: match[2].trim(),
      fullMatch: match[0],
    });
  }

  return blocks;
}

/**
 * 处理 Markdown 内容，将图表代码块替换为占位符
 *
 * @param content - 原始 Markdown 内容
 * @returns 处理后的内容和图表配置数组
 */
function processMarkdownContent(content: string): {
  processedContent: string;
  charts: Array<{ placeholder: string; code: string }>;
} {
  const codeBlocks = extractCodeBlocks(content);
  const charts: Array<{ placeholder: string; code: string }> = [];
  let processedContent = content;
  let chartIndex = 0;

  codeBlocks.forEach((block) => {
    if (block.language === "chart") {
      const placeholder = `<!--CHART_PLACEHOLDER_${chartIndex}-->`;
      charts.push({ placeholder, code: block.code });
      processedContent = processedContent.replace(block.fullMatch, placeholder);
      chartIndex++;
    }
  });

  return { processedContent, charts };
}

/**
 * Markdown 渲染组件
 *
 * 使用 @ant-design/x-markdown 渲染 AI 返回的 Markdown 格式文本
 * 支持代码高亮、表格、列表等 Markdown 语法
 * 特别支持 chart 代码块，用于渲染 ECharts 图表
 *
 * 图表使用示例：
 * ```chart
 * {
 *   "title": "销售数据",
 *   "xAxis": ["1月", "2月", "3月", "4月", "5月"],
 *   "series": [
 *     {
 *       "name": "销售额",
 *       "type": "line",
 *       "data": [120, 200, 150, 80, 70]
 *     }
 *   ]
 * }
 * ```
 *
 * @param content - Markdown 内容
 * @param isStreaming - 是否为流式输出（用于显示加载状态）
 * @returns 渲染后的 React 元素
 */
const MarkdownRenderer = memo<MarkdownRendererProps>(function MarkdownRenderer({
  content,
  isStreaming = false,
}) {
  // 处理 Markdown 内容，提取图表配置
  const { processedContent, charts } = useMemo(
    () => processMarkdownContent(content),
    [content],
  );

  // 如果没有图表，直接渲染 Markdown
  if (charts.length === 0) {
    return (
      <XMarkdown
        content={content}
        streaming={{
          hasNextChunk: isStreaming,
        }}
      />
    );
  }

  // 将内容分割成多个部分，在图表占位符处插入图表组件
  const parts = processedContent.split(/(<!--CHART_PLACEHOLDER_\d+-->)/);

  return (
    <div className="markdown-renderer">
      {parts.map((part, index) => {
        const chartMatch = part.match(/<!--CHART_PLACEHOLDER_(\d+)-->/);

        if (chartMatch) {
          const chartIndex = parseInt(chartMatch[1], 10);
          const chart = charts[chartIndex];

          if (chart) {
            return <MarkdownChart key={`chart-${index}`} code={chart.code} />;
          }
        }

        // 渲染普通 Markdown 内容
        if (part.trim()) {
          return (
            <XMarkdown
              key={`md-${index}`}
              content={part}
              streaming={{
                hasNextChunk: isStreaming && index === parts.length - 1,
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
});

export default MarkdownRenderer;
