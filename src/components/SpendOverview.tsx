'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DashboardSummary } from '@/types';
import { TrendingUp, PieChart as PieIcon, AlertTriangle } from 'lucide-react';

interface SpendOverviewProps {
  summary: DashboardSummary;
}

const CATEGORY_COLORS: Record<string, string> = {
  'OTT & Streaming': '#FF3366', // Critical Red/Pink
  'Developer & SaaS': '#3366FF', // Accent Blue
  'Fitness & Health': '#00E676', // Safe Green
  'Food & Dining': '#FFDE59', // Warning Yellow
  'Cloud Storage': '#000000', // Black
  'Gaming & Media': '#A855F7', // Purple
  'Utilities & Services': '#64748B', // Slate
  Other: '#94A3B8',
};

export function SpendOverview({ summary }: SpendOverviewProps) {
  const pieData = summary.categoryBreakdown.map((item) => ({
    name: item.category,
    value: item.spend,
    count: item.count,
    color: CATEGORY_COLORS[item.category] || '#000000',
  }));

  const trendData = summary.monthlySpendTrend.map((item) => ({
    month: item.month,
    Spend: item.spend,
    Hikes: item.hikesCount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Donut Category Breakdown */}
      <div className="border-4 border-black bg-white p-6 shadow-brutal-lg">
        <div className="flex items-center justify-between pb-4 border-b-4 border-black">
          <div className="flex items-center space-x-2">
            <PieIcon className="h-6 w-6 text-black stroke-[2.5]" />
            <h3 className="text-base font-black uppercase text-black">
              Category Spend Distribution
            </h3>
          </div>
          <span className="border-2 border-black bg-canvas px-2 py-0.5 text-xs font-mono font-bold uppercase text-black shadow-brutal-sm">
            {summary.categoryBreakdown.length} Categories
          </span>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="h-56 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#000000"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="border-2 border-black bg-white p-3 shadow-brutal text-xs font-mono">
                          <p className="font-black uppercase text-black">{data.name}</p>
                          <p className="font-bold text-black mt-1">
                            ₹{data.value.toLocaleString()} / mo ({data.count} subs)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-1/2 space-y-2">
            {pieData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between border-2 border-black p-2 bg-white shadow-brutal-sm text-xs font-mono font-bold text-black"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="h-3 w-3 border border-black"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate max-w-[120px] uppercase">{item.name}</span>
                </div>
                <span>₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 2: Monthly Spend Trend Line Chart */}
      <div className="border-4 border-black bg-white p-6 shadow-brutal-lg">
        <div className="flex items-center justify-between pb-4 border-b-4 border-black">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-black stroke-[2.5]" />
            <h3 className="text-base font-black uppercase text-black">
              Monthly Spend Trend & Hikes
            </h3>
          </div>
          <span className="flex items-center space-x-1 border-2 border-black bg-critical px-2 py-0.5 text-xs font-mono font-bold text-white shadow-brutal-sm uppercase">
            <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Price Hike Markers</span>
          </span>
        </div>

        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#000000" strokeDasharray="0" strokeWidth={1} />
              <XAxis
                dataKey="month"
                stroke="#000000"
                strokeWidth={2}
                fontSize={11}
                tickLine={true}
                tick={{ fill: '#000000', fontWeight: 'bold' }}
              />
              <YAxis
                stroke="#000000"
                strokeWidth={2}
                fontSize={11}
                tickLine={true}
                tick={{ fill: '#000000', fontWeight: 'bold' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="border-2 border-black bg-white p-3 shadow-brutal text-xs font-mono">
                        <p className="font-black uppercase text-black">{data.month}</p>
                        <p className="font-bold text-black mt-1">₹{data.Spend.toLocaleString()}</p>
                        {data.Hikes > 0 && (
                          <p className="font-black text-critical mt-1 uppercase">
                            Warning: {data.Hikes} price hike(s) detected!
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '8px' }} />
              <Line
                type="linear"
                dataKey="Spend"
                stroke="#000000"
                strokeWidth={3}
                dot={{ r: 5, fill: '#FF3366', stroke: '#000000', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#FFDE59', stroke: '#000000', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
