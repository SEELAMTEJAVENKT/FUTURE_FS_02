import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, FollowUp, Lead } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Header } from '../components/Layout/Header';
import {
  Calendar,
  Clock,
  CheckCircle,
  User,
  Loader2,
  Search,
  Filter,
  X,
  ChevronDown,
} from '../components/icons';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';

interface FollowUpWithLead extends FollowUp {
  leads?: Lead;
}

export function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUpWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const { user } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          leads (
            id,
            name,
            email,
            company,
            phone
          )
        `)
        .order('date', { ascending: true });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (error) {
      addNotification('error', 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    const { error } = await supabase
      .from('follow_ups')
      .update({ completed: true })
      .eq('id', id);

    if (error) {
      addNotification('error', 'Failed to mark as complete');
    } else {
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, completed: true } : f))
      );
      addNotification('success', 'Follow-up marked as complete');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('follow_ups').delete().eq('id', id);
    if (error) {
      addNotification('error', 'Failed to delete follow-up');
    } else {
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
      addNotification('success', 'Follow-up deleted');
    }
  };

  const filteredFollowUps = followUps.filter((f) => {
    const matchesSearch =
      f.leads?.name.toLowerCase().includes(search.toLowerCase()) ||
      f.leads?.email.toLowerCase().includes(search.toLowerCase()) ||
      (f.note && f.note.toLowerCase().includes(search.toLowerCase()));

    const followUpDate = new Date(f.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = !f.completed && (isFuture(followUpDate) || isToday(followUpDate));
    } else if (statusFilter === 'completed') {
      matchesStatus = f.completed;
    } else if (statusFilter === 'overdue') {
      matchesStatus = !f.completed && isPast(followUpDate) && !isToday(followUpDate);
    }

    return matchesSearch && matchesStatus;
  });

  const groupedFollowUps = {
    today: filteredFollowUps.filter((f) => !f.completed && isToday(new Date(f.date))),
    tomorrow: filteredFollowUps.filter((f) => !f.completed && isTomorrow(new Date(f.date))),
    upcoming: filteredFollowUps.filter((f) => {
      const date = new Date(f.date);
      return !f.completed && isFuture(date) && !isToday(date) && !isTomorrow(date);
    }),
    overdue: filteredFollowUps.filter((f) => {
      const date = new Date(f.date);
      return !f.completed && isPast(date) && !isToday(date);
    }),
    completed: filteredFollowUps.filter((f) => f.completed),
  };

  const stats = {
    total: followUps.length,
    today: groupedFollowUps.today.length,
    overdue: groupedFollowUps.overdue.length,
    completed: groupedFollowUps.completed.length,
  };

  const renderFollowUpItem = (f: FollowUpWithLead) => (
    <div
      key={f.id}
      className={`p-4 rounded-xl border ${
        f.completed
          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          f.completed
            ? 'bg-slate-200 dark:bg-slate-700'
            : 'bg-gradient-to-br from-blue-500 to-cyan-400'
        }`}>
          {f.completed ? (
            <CheckCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          ) : (
            <Clock className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`font-semibold ${
                f.completed
                  ? 'text-slate-500 dark:text-slate-400 line-through'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {f.leads?.name || 'Unknown Lead'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {f.leads?.company || f.leads?.email}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {format(new Date(f.date), 'MMM dd, yyyy')}
              </p>
              {f.time && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{f.time}</p>
              )}
            </div>
          </div>

          {f.note && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
              {f.note}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <Link
              to={`/leads/${f.lead_id}`}
              className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
            >
              View Lead →
            </Link>
            <div className="flex items-center gap-2">
              {!f.completed && (
                <button
                  onClick={() => handleComplete(f.id)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  Mark Complete
                </button>
              )}
              <button
                onClick={() => handleDelete(f.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = (title: string, items: FollowUpWithLead[], bgClass: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${bgClass}`}>
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 dark:bg-black/10">
            {items.length}
          </span>
        </div>
        <div className="space-y-3">
          {items.map(renderFollowUpItem)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header title="Follow-ups" subtitle="Manage your scheduled follow-ups" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Follow-ups</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.today}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Due Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overdue}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Overdue</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search follow-ups..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed' | 'overdue')}
                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Follow-ups</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Follow-ups List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No follow-ups found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Schedule follow-ups from lead details pages'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {renderSection('Overdue', groupedFollowUps.overdue, 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400')}
            {renderSection('Today', groupedFollowUps.today, 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}
            {renderSection('Tomorrow', groupedFollowUps.tomorrow, 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400')}
            {renderSection('Upcoming', groupedFollowUps.upcoming, 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}
            {renderSection('Completed', groupedFollowUps.completed, 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400')}
          </div>
        )}
      </div>
    </div>
  );
}
