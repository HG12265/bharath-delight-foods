"use client";

import React from "react";
import { BarChart3, LineChart as LineIcon, PieChart } from "lucide-react";

interface ChartDataPoint {
  label: string;
  value: number;
}

interface DistributionDataPoint {
  label: string;
  value: number;
  percentage: number;
}

interface ChartProps {
  title: string;
  data?: ChartDataPoint[];
}

interface DistributionProps {
  title: string;
  data?: DistributionDataPoint[];
}

function EmptyStatePlaceholder({ title, icon: Icon }: { title: string; icon: React.ComponentType<any> }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[220px] bg-white border border-burnishedGold/15 rounded font-sans">
      <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-burnishedGold/10 flex items-center justify-center text-burnishedGold/60 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-deodharForest mb-1">
        {title}
      </h3>
      <p className="text-[11px] text-indianInk/50 max-w-[240px] leading-relaxed">
        Not enough data yet. Metrics will appear after orders are recorded.
      </p>
    </div>
  );
}

export const LineChart: React.FC<ChartProps> = ({ title, data }) => {
  if (!data || data.length === 0) {
    return <EmptyStatePlaceholder title={title} icon={LineIcon} />;
  }

  // Future rendering if data is supplied
  return (
    <div className="bg-white border border-burnishedGold/15 rounded p-5 space-y-3 font-sans">
      <h3 className="text-xs font-bold uppercase tracking-wider text-deodharForest">{title}</h3>
      <svg className="w-full h-[180px] overflow-visible">
        {/* Placeholder SVG logic using real data */}
      </svg>
    </div>
  );
};

export const BarChart: React.FC<ChartProps> = ({ title, data }) => {
  if (!data || data.length === 0) {
    return <EmptyStatePlaceholder title={title} icon={BarChart3} />;
  }

  // Future rendering if data is supplied
  return (
    <div className="bg-white border border-burnishedGold/15 rounded p-5 space-y-3 font-sans">
      <h3 className="text-xs font-bold uppercase tracking-wider text-deodharForest">{title}</h3>
      <svg className="w-full h-[180px] overflow-visible">
        {/* Placeholder SVG logic using real data */}
      </svg>
    </div>
  );
};

export const ProgressDistribution: React.FC<DistributionProps> = ({ title, data }) => {
  if (!data || data.length === 0) {
    return <EmptyStatePlaceholder title={title} icon={PieChart} />;
  }

  // Future rendering if data is supplied
  return (
    <div className="bg-white border border-burnishedGold/15 rounded p-5 space-y-4 font-sans text-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-deodharForest mb-2">{title}</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between font-semibold text-indianInk">
              <span>{item.label}</span>
              <span>{item.value} units ({item.percentage}%)</span>
            </div>
            <div className="w-full h-2 bg-[#FAF9F6] border border-burnishedGold/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gheeGold rounded-full"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
