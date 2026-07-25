'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SubscriptionItem } from '@/types';
import { calculate12MonthLeakForecast } from '@/lib/analyzer/leak-forecast';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface LeakForecastChartProps {
  subscriptions: SubscriptionItem[];
}

export function LeakForecastChart({ subscriptions }: LeakForecastChartProps) {
  const forecast = calculate12MonthLeakForecast(subscriptions);

  return (
    <div className="border-4 border-black bg-white p-6 shadow-brutal-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-4 border-black gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-black stroke-[2.5]" />
            <h3 className="text-xl font-black uppercase text-black">
              12-Month Cumulative Waste Forecast
            </h3>
          </div>
          <p className="text-xs font-bold uppercase text-black tracking-wide mt-1">
            Forward projection extrapolating detected price hikes over the next 12 billing cycles.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono font-bold">
          <span className="border-2 border-black bg-critical text-white px-3 py-1 shadow-brutal-sm uppercase">
            +₹{forecast.total12MonthExcessHikeWaste.toLocaleString()} Hike Waste
          </span>
          <span className="border-2 border-black bg-warning text-black px-3 py-1 shadow-brutal-sm uppercase">
            ₹{forecast.total12MonthProjectedSpend.toLocaleString()} Total 12M
          </span>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecast.forecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#000000" strokeDasharray="0" strokeWidth={1} />
            <XAxis
              dataKey="monthName"
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
                      <p className="font-black uppercase text-black">{data.monthName}</p>
                      <p className="font-bold text-black mt-1">
                        Cumulative Spend: ₹{data.cumulativeTotalSpend.toLocaleString()}
                      </p>
                      <p className="font-black text-critical mt-0.5">
                        Price Hike Excess Loss: ₹{data.priceHikeExcess.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '8px' }} />
            <Area
              type="monotone"
              dataKey="cumulativeTotalSpend"
              name="Cumulative Projected Spend"
              stroke="#000000"
              strokeWidth={3}
              fill="#FFDE59"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="priceHikeExcess"
              name="Price Hike Excess Loss"
              stroke="#000000"
              strokeWidth={3}
              fill="#FF3366"
              fillOpacity={0.9}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
