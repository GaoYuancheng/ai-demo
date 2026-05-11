import { memo, useMemo } from "react";
import ChartRenderer, { ChartConfig } from "./ChartRenderer";

/**
 * Markdown 图表组件属性
 */
interface MarkdownChartProps {
  /** 图表代码内容（JSON 格式） */
  code: string;
  /** 图表语言类型 */
  language?: string;
}

/**
 * 解析图表配置
 *
 * 从代码块内容中解析图表配置
 * 支持 JSON 格式和简化格式
 *
 * @param code - 代码内容
 * @returns 图表配置对象或 null
 */
function parseChartConfig(code: string): ChartConfig | null {
  try {
    // 尝试解析 JSON 格式
    const parsed = JSON.parse(code);

    // 验证必要的字段
    if (!parsed.series || !Array.isArray(parsed.series)) {
      console.warn("图表配置缺少 series 字段");
      return null;
    }

    return {
      title: parsed.title,
      xAxis: parsed.xAxis,
      yAxisName: parsed.yAxisName,
      series: parsed.series,
      legend: parsed.legend,
      theme: parsed.theme || "light",
      options: parsed.options,
    };
  } catch (error) {
    // 尝试解析简化格式（CSV 风格）
    const lines = code
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    if (lines.length < 2) {
      console.warn("图表数据格式不正确");
      return null;
    }

    // 解析表头
    const headers = lines[0].split(",").map((h) => h.trim());

    if (headers.length < 2) {
      console.warn("图表数据至少需要两列");
      return null;
    }

    // 解析数据行
    const dataRows = lines
      .slice(1)
      .map((line) => line.split(",").map((cell) => cell.trim()));

    // 第一列作为 X 轴
    const xAxis = dataRows.map((row) => row[0]);

    // 其余列作为系列数据
    const series = headers.slice(1).map((header, index) => ({
      name: header,
      type: "line" as const,
      data: dataRows.map((row) => parseFloat(row[index + 1]) || 0),
    }));

    return {
      xAxis,
      series,
      theme: "light",
    };
  }
}

/**
 * Markdown 图表组件
 *
 * 用于在 Markdown 内容中渲染图表
 * 支持通过代码块插入图表，语言标记为 chart
 *
 * 使用示例：
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
 * @param code - 图表配置代码
 * @param language - 代码语言
 * @returns 图表组件或错误提示
 */
const MarkdownChart = memo<MarkdownChartProps>(function MarkdownChart({
  code,
}) {
  const config = useMemo(() => parseChartConfig(code), [code]);

  if (!config) {
    return (
      <div className="markdown-chart-error" style={errorStyle}>
        <p>图表配置格式错误</p>
        <pre style={preStyle}>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="markdown-chart" style={containerStyle}>
      <ChartRenderer config={config} width="100%" height={350} />
    </div>
  );
});

// 样式定义
const containerStyle: React.CSSProperties = {
  margin: "16px 0",
  padding: "16px",
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  border: "1px solid #e8e8e8",
};

const errorStyle: React.CSSProperties = {
  margin: "16px 0",
  padding: "16px",
  backgroundColor: "#fff2f0",
  border: "1px solid #ffccc7",
  borderRadius: "8px",
  color: "#cf1322",
};

const preStyle: React.CSSProperties = {
  marginTop: "8px",
  padding: "12px",
  backgroundColor: "#f5f5f5",
  borderRadius: "4px",
  overflow: "auto",
  fontSize: "12px",
};

export default MarkdownChart;
