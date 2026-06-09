import React, { useState, useEffect } from 'react';
import { supabase, Lead, LEAD_STATUSES } from '../lib/supabase';
import { Header } from '../components/Layout/Header';
import {
  Users,
  UserPlus,
  Phone,
  TrendingUp,
  Target,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
} from '../components/icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  monthlyGrowth: number;
}

interface LeadByStatus {
  status: string;
  count: number;
}

interface MonthlyData {
  month: string;
  leads: number;
}

const COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
  });
  const [leadsByStatus, setLeadsByStatus] = useState<LeadByStatus[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        leadsResponse,
        statusCounts,
        thisMonth,
        lastMonth,
        recentResponse,
      ] = await Promise.all([
        supabase.from('leads').select('status, created_at'),
        supabase.rpc('get_leads_by_status'),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const leads = leadsResponse.data || [];
      const total = leads.length;
      const converted = leads.filter((l) => l.status === 'Converted').length;

      let growth = 0;
      if (lastMonth.count && thisMonth.count) {
        growth = ((thisMonth.count - lastMonth.count) / (lastMonth.count || 1)) * 100;
      } else if (thisMonth.count) {
        growth = 100;
      }

      setStats({
        totalLeads: total,
        newLeads: leads.filter((l) => l.status === 'New').length,
        contactedLeads: leads.filter((l) => l.status === 'Contacted').length,
        qualifiedLeads: leads.filter((l) => l.status === 'Qualified').length,
        convertedLeads: converted,
        conversionRate: total > 0 ? (converted / total) * 100 : 0,
        monthlyGrowth: growth,
      });

      const statusData = LEAD_STATUSES.map((status) => ({
        status,
        count: leads.filter((l) => l.status === status).length,
      })).filter((s) => s.count > 0);
      setLeadsByStatus(statusData);

      const last6Months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const count = leads.filter((l) => {
          const created = new Date(l.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length;

        last6Months.push({
          month: date.toLocaleString('en-US', { month: 'short' }),
          leads: count,
        });
      }
      setMonthlyData(last6Months);

      setRecentLeads(recentResponse.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      title: 'New Leads',
      value: stats.newLeads,
      icon: UserPlus,
      color: 'from-cyan-500 to-cyan-600',
      shadow: 'shadow-cyan-500/25',
    },
    {
      title: 'Contacted',
      value: stats.contactedLeads,
      icon: Phone,
      color: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      title: 'Qualified',
      value: stats.qualifiedLeads,
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/25',
    },
    {
      title: 'Converted',
      value: stats.convertedLeads,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-rose-500 to-rose-600',
      shadow: 'shadow-rose-500/25',
    },
  ];

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Here's your lead overview."
      />

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Growth Banner */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Monthly Growth</h3>
                <p className="text-blue-100">Your lead generation is {stats.monthlyGrowth >= 0 ? 'up' : 'down'} this month</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{Math.abs(stats.monthlyGrowth).toFixed(1)}%</span>
                {stats.monthlyGrowth >= 0 ? (
                  <ArrowUpRight className="w-8 h-8" />
                ) : (
                  <ArrowDownRight className="w-8 h-8" />
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {statsCards.map((card) => (
                <div
                  key={card.title}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${card.color} ${card.shadow} mb-4`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Leads by Status */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Leads by Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {leadsByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {leadsByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Lead Growth */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Lead Growth</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLeads)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Leads</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {recentLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-900 dark:text-white">{lead.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {lead.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lead.status === 'New' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            lead.status === 'Contacted' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                            lead.status === 'Qualified' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            lead.status === 'Proposal Sent' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lead.priority === 'Urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            lead.priority === 'High' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            lead.priority === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
