"use client";

import React from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  /** If true, path is drawn from bottom (min) to top (max). */
  fillBelow?: boolean;
};

/**
 * Lightweight SVG sparkline. No chart library.
 * Scales values to fit height; zero values are drawn at bottom.
 */
export const Sparkline = React.memo(function Sparkline({
  data,
  width = 80,
  height = 32,
  stroke = "var(--ice)",
  strokeWidth = 1.5,
  className = "",
  fillBelow = false,
}: SparklineProps) {
  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        aria-hidden
      />
    );
  }

  const min = Math.min(0, ...data);
  const max = Math.max(1, ...data);
  const range = max - min || 1;
  const step = data.length <= 1 ? width : (width - 1) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = data.length <= 1 ? width / 2 : i * step;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const firstX = data.length <= 1 ? width / 2 : 0;
  const lastX = data.length <= 1 ? width / 2 : (data.length - 1) * step;
  const areaD =
    points.length > 0
      ? `M ${points.join(" L ")} L ${lastX},${height} L ${firstX},${height} Z`
      : "";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      {fillBelow && areaD && (
        <path
          d={areaD}
          fill={stroke}
          fillOpacity={0.15}
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />
    </svg>
  );
});
