import React, { useState, useEffect } from 'react';
import { supabase, LEAD_STATUSES, LEAD_SOURCES } from '../lib/supabase';
import { Header } from '../components/Layout/Header';
import { Loader2 } from '../components/icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = {
  primary: '#3B82F6',
  cyan: '#06B6D4',
  emerald: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  slate: '#64748B',
};

const statusColors: Record<string, string> = {
  'New': '#3B82F6',
  'Contacted': '#06B6D4',
  'Qualified': '#8B5CF6',
  'Proposal Sent': '#F59E0B',
  'Converted': '#10B981',
  'Closed Lost': '#EF4444',
};

const sourceColors: Record<string, string> = {
  'Website': '#3B82F6',
  'Referral': '#10B981',
  'Social Media': '#06B6D4',
  'Direct': '#F59E0B',
  'Email Campaign': '#8B5CF6',
  'Other': '#64748B',
};

interface AnalyticsData {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  monthlyLeads: { month: string; leads: number; converted: number }[];
  statusFlow: { from: string; to: string; count: number }[];
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const { data: allLeads } = await supabase.from('leads').select('status');

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter((l) => l.status === 'Converted').length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Leads by status
      const leadsByStatus = LEAD_STATUSES.map((status) => ({
        status,
        count: leads?.filter((l) => l.status === status).length || 0,
      })).filter((s) => s.count > 0);

      // Leads by source
      const leadsBySource = LEAD_SOURCES.map((source) => ({
        source,
        count: leads?.filter((l) => l.source === source).length || 0,
      })).filter((s) => s.count > 0);

      // Monthly leads trend
      const monthlyLeads = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const monthLeads = leads?.filter((l) => {
          const created = new Date(l.created_at);
          return created >= monthStart && created <= monthEnd;
        }) || [];

        monthlyLeads.push({
          month: date.toLocaleString('en-US', { month: 'short' }),
          leads: monthLeads.length,
          converted: monthLeads.filter((l) => l.status === 'Converted').length,
        });
      }

      setData({
        totalLeads,
        convertedLeads,
        conversionRate,
        leadsByStatus,
        leadsBySource,
        monthlyLeads,
        statusFlow: [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tooltipStyle = {
    backgroundColor: 'rgba(255,255,255,0.95)',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  return (
    <div>
      <Header title="Analytics" subtitle="Track your lead performance and trends" />

      <div className="p-6">
        {/* Date Range Selector */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !data ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Failed to load analytics</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Total Leads
                </h3>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">{data.totalLeads}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Converted Leads
                </h3>
                <p className="text-4xl font-bold text-emerald-500">{data.convertedLeads}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Conversion Rate
                </h3>
                <p className="text-4xl font-bold text-blue-500">{data.conversionRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Leads by Status - Donut */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Leads by Status
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.leadsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                      >
                        {data.leadsByStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={statusColors[entry.status] || COLORS.slate}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {data.leadsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusColors[item.status] || COLORS.slate }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {item.status} ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leads by Source - Bar */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Leads by Source
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.leadsBySource} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                      <YAxis type="category" dataKey="source" stroke="#94A3B8" fontSize={12} width={100} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {data.leadsBySource.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={sourceColors[entry.source] || COLORS.slate}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6">
              {/* Monthly Lead Growth - Area */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Monthly Lead Growth
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyLeads}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLeads)"
                        name="Total Leads"
                      />
                      <Area
                        type="monotone"
                        dataKey="converted"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorConverted)"
                        name="Converted"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Conversion Funnel
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
                {data.leadsByStatus.map((item, index) => {
                  const total = data.leadsByStatus.reduce((sum, i) => sum + i.count, 0);
                  const percentage = total > 0 ? (item.count / total) * 100 : 0;

                  return (
                    <div key={item.status} className="flex items-center">
                      <div className="relative">
                        <div
                          className="h-12 md:h-16 flex items-center justify-center px-4 md:px-6 text-white font-medium text-sm"
                          style={{
                            backgroundColor: statusColors[item.status],
                            clipPath: index === 0
                              ? 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                              : index === data.leadsByStatus.length - 1
                              ? 'polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)'
                              : 'polygon(10px 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 10px 100%, 0 50%)',
                          }}
                        >
                          <div className="text-center">
                            <p className="text-white">{item.count}</p>
                            <p className="text-xs opacity-90 hidden md:block">{item.status}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
