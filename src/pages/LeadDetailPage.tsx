import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, Lead, Note, FollowUp, StatusHistory, LEAD_STATUSES, LEAD_PRIORITIES } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  CheckCircle,
  User,
  Loader2,
  Send,
  X,
} from '../components/icons';
import { format } from 'date-fns';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const [newFollowUp, setNewFollowUp] = useState({
    date: '',
    time: '',
    note: '',
  });
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      const [leadRes, notesRes, followUpsRes, historyRes] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).maybeSingle(),
        supabase.from('notes').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
        supabase.from('follow_ups').select('*').eq('lead_id', id).order('date', { ascending: true }),
        supabase.from('status_history').select('*').eq('lead_id', id).order('changed_at', { ascending: false }),
      ]);

      if (!leadRes.data) {
        navigate('/leads');
        return;
      }

      setLead(leadRes.data);
      setNotes(notesRes.data || []);
      setFollowUps(followUpsRes.data || []);
      setStatusHistory(historyRes.data || []);
    } catch (error) {
      addNotification('error', 'Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      addNotification('error', 'Failed to update status');
    } else {
      setLead((prev) => prev ? { ...prev, status: newStatus } : null);
      addNotification('success', 'Status updated successfully');
      fetchLeadData();
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ priority: newPriority })
      .eq('id', id);

    if (error) {
      addNotification('error', 'Failed to update priority');
    } else {
      setLead((prev) => prev ? { ...prev, priority: newPriority } : null);
      addNotification('success', 'Priority updated successfully');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    const { error } = await supabase.from('notes').insert({
      lead_id: id,
      content: newNote,
      created_by: user.id,
      created_by_email: user.email,
    });

    if (error) {
      addNotification('error', 'Failed to add note');
    } else {
      setNewNote('');
      setShowNoteForm(false);
      addNotification('success', 'Note added successfully');
      fetchLeadData();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) {
      addNotification('error', 'Failed to delete note');
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      addNotification('success', 'Note deleted successfully');
    }
  };

  const handleAddFollowUp = async () => {
    if (!newFollowUp.date || !user) return;

    const { error } = await supabase.from('follow_ups').insert({
      lead_id: id,
      date: newFollowUp.date,
      time: newFollowUp.time || null,
      note: newFollowUp.note || null,
      created_by: user.id,
    });

    if (error) {
      addNotification('error', 'Failed to add follow-up');
    } else {
      setNewFollowUp({ date: '', time: '', note: '' });
      setShowFollowUpForm(false);
      addNotification('success', 'Follow-up added successfully');
      fetchLeadData();
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    const { error } = await supabase.from('follow_ups').delete().eq('id', followUpId);
    if (error) {
      addNotification('error', 'Failed to delete follow-up');
    } else {
      setFollowUps((prev) => prev.filter((f) => f.id !== followUpId));
      addNotification('success', 'Follow-up deleted successfully');
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    const { error } = await supabase
      .from('follow_ups')
      .update({ completed: true })
      .eq('id', followUpId);

    if (error) {
      addNotification('error', 'Failed to mark as complete');
    } else {
      setFollowUps((prev) =>
        prev.map((f) => (f.id === followUpId ? { ...f, completed: true } : f))
      );
      addNotification('success', 'Follow-up marked as complete');
    }
  };

  const handleDeleteLead = async () => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      addNotification('error', 'Failed to delete lead');
    } else {
      addNotification('success', 'Lead deleted successfully');
      navigate('/leads');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/leads"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{lead.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{lead.company || lead.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/leads/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <p className="font-medium text-slate-900 dark:text-white">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="font-medium text-slate-900 dark:text-white">{lead.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Company</p>
                    <p className="font-medium text-slate-900 dark:text-white">{lead.company || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
              {lead.message && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Initial Message
                  </h3>
                  <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                    {lead.message}
                  </p>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notes</h2>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>

              {showNoteForm && (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note..."
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleAddNote}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setShowNoteForm(false);
                        setNewNote('');
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {note.created_by_email || 'Admin'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow-ups Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Follow-ups</h2>
                <button
                  onClick={() => setShowFollowUpForm(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Follow-up
                </button>
              </div>

              {showFollowUpForm && (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newFollowUp.date}
                        onChange={(e) => setNewFollowUp((prev) => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={newFollowUp.time}
                        onChange={(e) => setNewFollowUp((prev) => ({ ...prev, time: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={newFollowUp.note}
                      onChange={(e) => setNewFollowUp((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="What needs to be followed up on?"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddFollowUp}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => {
                        setShowFollowUpForm(false);
                        setNewFollowUp({ date: '', time: '', note: '' });
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {followUps.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No follow-ups scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((followUp) => (
                    <div
                      key={followUp.id}
                      className={`p-4 rounded-lg border ${
                        followUp.completed
                          ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            followUp.completed
                              ? 'bg-slate-200 dark:bg-slate-600'
                              : 'bg-emerald-200 dark:bg-emerald-800'
                          }`}>
                            {followUp.completed ? (
                              <CheckCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            ) : (
                              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                followUp.completed
                                  ? 'text-slate-500 dark:text-slate-400 line-through'
                                  : 'text-slate-900 dark:text-white'
                              }`}>
                                {format(new Date(followUp.date), 'MMM dd, yyyy')}
                              </span>
                              {followUp.time && (
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  at {followUp.time}
                                </span>
                              )}
                            </div>
                            {followUp.note && (
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {followUp.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!followUp.completed && (
                            <button
                              onClick={() => handleCompleteFollowUp(followUp.id)}
                              className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                              title="Mark as Complete"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFollowUp(followUp.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Lead Status
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Current Status
                  </label>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border-0 font-medium ${
                      lead.status === 'New' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      lead.status === 'Contacted' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                      lead.status === 'Qualified' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      lead.status === 'Proposal Sent' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Priority
                  </label>
                  <select
                    value={lead.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border-0 font-medium ${
                      lead.priority === 'Urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      lead.priority === 'High' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      lead.priority === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {LEAD_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Source Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Lead Source
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{lead.source}</span>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Status History
              </h2>
              {statusHistory.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No status changes yet</p>
              ) : (
                <div className="space-y-3">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-500 dark:text-slate-400">
                        {history.old_status || 'New'} → {history.new_status}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {format(new Date(history.changed_at), 'MMM dd')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Delete Lead?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                This action cannot be undone. All notes and follow-ups will also be deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLead}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
