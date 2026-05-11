import { useEffect, useRef, memo } from "react";
import * as echarts from "echarts";
import type { EChartsOption, ECharts } from "echarts";

/**
 * 图表类型枚举
 */
export type ChartType = "line" | "bar" | "pie" | "scatter" | "area";

/**
 * 图表数据点
 */
interface ChartDataPoint {
  name?: string;
  value: number | number[];
  [key: string]: unknown;
}

/**
 * 图表系列数据
 */
interface ChartSeries {
  name?: string;
  type: ChartType;
  data: ChartDataPoint[] | number[] | number[][];
  smooth?: boolean;
  areaStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 图表配置接口
 */
export interface ChartConfig {
  /** 图表标题 */
  title?: string;
  /** X轴数据 */
  xAxis?: string[] | number[];
  /** Y轴名称 */
  yAxisName?: string;
  /** 图表系列数据 */
  series: ChartSeries[];
  /** 图例数据 */
  legend?: string[];
  /** 主题颜色 */
  theme?: "light" | "dark";
  /** 自定义 ECharts 配置 */
  options?: EChartsOption;
}

/**
 * 图表渲染组件属性
 */
interface ChartRendererProps {
  /** 图表配置 */
  config: ChartConfig;
  /** 图表宽度 */
  width?: string | number;
  /** 图表高度 */
  height?: string | number;
  /** 图表容器类名 */
  className?: string;
}

/**
 * 图表渲染组件
 *
 * 基于 ECharts 的 React 图表组件，支持多种图表类型
 * 包括折线图、柱状图、饼图、散点图和面积图
 *
 * @param config - 图表配置对象
 * @param width - 图表宽度，默认为 100%
 * @param height - 图表高度，默认为 300px
 * @param className - 自定义 CSS 类名
 * @returns 图表 React 元素
 */
const ChartRenderer = memo<ChartRendererProps>(function ChartRenderer({
  config,
  width = "100%",
  height = 300,
  className = "",
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化 ECharts 实例
    chartInstanceRef.current = echarts.init(chartRef.current);

    // 生成图表配置
    const option = generateChartOption(config);
    chartInstanceRef.current.setOption(option);

    // 监听窗口大小变化，自动调整图表尺寸
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [config]);

  // 当配置变化时更新图表
  useEffect(() => {
    if (chartInstanceRef.current) {
      const option = generateChartOption(config);
      chartInstanceRef.current.setOption(option, true);
    }
  }, [config]);

  const containerStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      ref={chartRef}
      style={containerStyle}
      className={`chart-renderer ${className}`}
    />
  );
});

/**
 * 生成 ECharts 配置选项
 *
 * 根据图表配置生成对应的 ECharts 配置对象
 *
 * @param config - 图表配置
 * @returns ECharts 配置选项
 */
function generateChartOption(config: ChartConfig): EChartsOption {
  const {
    title,
    xAxis,
    yAxisName,
    series,
    legend,
    theme = "light",
    options,
  } = config;

  // 基础配置
  const baseOption: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  };

  // 标题配置
  if (title) {
    baseOption.title = {
      text: title,
      left: "center",
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: "normal",
        color: theme === "dark" ? "#fff" : "#333",
      },
    };
  }

  // 提示框配置
  baseOption.tooltip = {
    trigger: series.some((s) => s.type === "pie") ? "item" : "axis",
    backgroundColor:
      theme === "dark" ? "rgba(50, 50, 50, 0.9)" : "rgba(255, 255, 255, 0.9)",
    borderColor: theme === "dark" ? "#555" : "#ddd",
    textStyle: {
      color: theme === "dark" ? "#fff" : "#333",
    },
  };

  // 图例配置
  if (legend && legend.length > 0) {
    baseOption.legend = {
      data: legend,
      bottom: 10,
      textStyle: {
        color: theme === "dark" ? "#fff" : "#333",
      },
    };
  } else if (series.some((s) => s.name)) {
    baseOption.legend = {
      data: series.filter((s) => s.name).map((s) => s.name!),
      bottom: 10,
      textStyle: {
        color: theme === "dark" ? "#fff" : "#333",
      },
    };
  }

  // 处理饼图的特殊配置
  const isPieChart = series.some((s) => s.type === "pie");

  if (!isPieChart) {
    // X轴配置
    baseOption.xAxis = {
      type: "category",
      data: xAxis || [],
      axisLine: {
        lineStyle: {
          color: theme === "dark" ? "#555" : "#ddd",
        },
      },
      axisLabel: {
        color: theme === "dark" ? "#ccc" : "#666",
      },
    };

    // Y轴配置
    baseOption.yAxis = {
      type: "value",
      name: yAxisName || "",
      nameTextStyle: {
        color: theme === "dark" ? "#ccc" : "#666",
      },
      axisLine: {
        lineStyle: {
          color: theme === "dark" ? "#555" : "#ddd",
        },
      },
      axisLabel: {
        color: theme === "dark" ? "#ccc" : "#666",
      },
      splitLine: {
        lineStyle: {
          color: theme === "dark" ? "#333" : "#eee",
        },
      },
    };

    // 网格配置
    baseOption.grid = {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: title ? "15%" : "10%",
      containLabel: true,
    };
  }

  // 系列数据配置
  baseOption.series = series.map((s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seriesConfig: Record<string, any> = {
      name: s.name,
      type: s.type === "area" ? "line" : s.type,
      data: s.data,
    };

    // 面积图特殊配置
    if (s.type === "area") {
      seriesConfig.areaStyle = s.areaStyle || { opacity: 0.3 };
      seriesConfig.smooth = s.smooth !== false;
    }

    // 折线图平滑配置
    if (s.type === "line" && s.smooth !== undefined) {
      seriesConfig.smooth = s.smooth;
    }

    // 饼图特殊配置
    if (s.type === "pie") {
      seriesConfig.radius = s.data.length > 1 ? ["40%", "70%"] : "50%";
      seriesConfig.center = ["50%", "50%"];
      seriesConfig.itemStyle = {
        borderRadius: 8,
        borderColor: theme === "dark" ? "#333" : "#fff",
        borderWidth: 2,
      };
      seriesConfig.label = {
        show: true,
        formatter: "{b}: {c} ({d}%)",
        color: theme === "dark" ? "#ccc" : "#666",
      };
    }

    return seriesConfig;
  });

  // 合并自定义配置
  if (options) {
    return { ...baseOption, ...options };
  }

  return baseOption;
}

export default ChartRenderer;
