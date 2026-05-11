import { useEffect, useRef, memo } from "react";
import * as echarts from "echarts";
import type { EChartsOption, ECharts } from "echarts";

export type ChartType = "line" | "bar" | "pie" | "scatter" | "area";

interface ChartDataPoint {
  name?: string;
  value: number | number[];
  [key: string]: unknown;
}

interface ChartSeries {
  name?: string;
  type: ChartType;
  data: ChartDataPoint[] | number[] | number[][];
  smooth?: boolean;
  areaStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ChartConfig {
  title?: string;
  xAxis?: string[] | number[];
  yAxisName?: string;
  series: ChartSeries[];
  legend?: string[];
  theme?: "light" | "dark";
  options?: EChartsOption;
}

interface ChartRendererProps {
  config: ChartConfig;
  width?: string | number;
  height?: string | number;
  className?: string;
}

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

    chartInstanceRef.current = echarts.init(chartRef.current);

    const option = generateChartOption(config);
    chartInstanceRef.current.setOption(option);

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

  const baseOption: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  };

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

  baseOption.tooltip = {
    trigger: series.some((s) => s.type === "pie") ? "item" : "axis",
    backgroundColor:
      theme === "dark" ? "rgba(50, 50, 50, 0.9)" : "rgba(255, 255, 255, 0.9)",
    borderColor: theme === "dark" ? "#555" : "#ddd",
    textStyle: {
      color: theme === "dark" ? "#fff" : "#333",
    },
  };

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

  const isPieChart = series.some((s) => s.type === "pie");

  if (!isPieChart) {
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

    baseOption.grid = {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: title ? "15%" : "10%",
      containLabel: true,
    };
  }

  baseOption.series = series.map((s) => {
    const seriesConfig: Record<string, unknown> = {
      name: s.name,
      type: s.type === "area" ? "line" : s.type,
      data: s.data,
    };

    if (s.type === "area") {
      seriesConfig.areaStyle = s.areaStyle || { opacity: 0.3 };
      seriesConfig.smooth = s.smooth !== false;
    }

    if (s.type === "line" && s.smooth !== undefined) {
      seriesConfig.smooth = s.smooth;
    }

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

  if (options) {
    return { ...baseOption, ...options };
  }

  return baseOption;
}

export default ChartRenderer;
