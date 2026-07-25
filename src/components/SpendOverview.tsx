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
  'OTT & Streaming': '#38BDF8', // Cyan
  'Developer & SaaS': '#A855F7', // Purple
  'Fitness & Health': '#10B981', // Emerald
  'Food & Dining': '#F59E0B', // Amber
  'Cloud Storage': '#3B82F6', // Blue
  'Gaming & Media': '#EC4899', // Pink
  'Utilities & Services': '#64748B', // Slate
  Other: '#94A3B8',
};

export function SpendOverview({ summary }: SpendOverviewProps) {
  const pieData = summary.categoryBreakdown.map((item) => ({
    name: item.category,
    value: item.spend,
    count: item.count,
    color: CATEGORY_COLORS[item.category] || '#94A3B8',
  }));

  const trendData = summary.monthlySpendTrend.map((item) => ({
    month: item.month,
    Spend: item.spend,
    Hikes: item.hikesCount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Donut Category Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <PieIcon className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Category Spend Distribution</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {summary.categoryBreakdown.length} active categories
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
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 shadow-xl text-xs">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-cyan-400 font-mono mt-1">
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
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-mono text-slate-400">₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 2: Monthly Spend Trend Line Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Monthly Spend Trend & Price Hikes</h3>
          </div>
          <span className="flex items-center space-x-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <AlertTriangle className="h-3 w-3" />
            <span>Price Hike Markers</span>
          </span>
        </div>

        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 shadow-xl text-xs">
                        <p className="font-bold text-slate-300">{data.month}</p>
                        <p className="text-purple-400 font-mono mt-1">₹{data.Spend.toLocaleString()}</p>
                        {data.Hikes > 0 && (
                          <p className="text-rose-400 font-medium mt-0.5">
                            🚨 {data.Hikes} price hike(s) detected!
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="Spend"
                stroke="#A855F7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#A855F7' }}
                activeDot={{ r: 6, fill: '#38BDF8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
