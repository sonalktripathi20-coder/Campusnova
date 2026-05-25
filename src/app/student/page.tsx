'use client';

import React, { useState } from 'react';
import { usePortal } from '@/context/PortalContext';
import { GlowCard } from '@/components/GlowCard';
import { ComplaintTimeline } from '@/components/ComplaintTimeline';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Modal } from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, 
  AlertTriangle, 
  CheckCircle2, 
  UserX, 
  EyeOff, 
  Upload, 
  RotateCcw, 
  Search, 
  CheckCircle,
  Plus,
  Send,
  Inbox,
  ShieldCheck,
  Trash2
} from 'lucide-react';

interface SubDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function StudentDashboard({ activeTab, setActiveTab }: SubDashboardProps) {
  const { 
    currentUser, 
    complaints, 
    createComplaint, 
    supportComplaint, 
    reopenComplaint, 
    rateComplaintResolution,
    deleteComplaint
  } = usePortal();

  // Create Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Lecturer / ERP / Marks' | 'Maintenance' | 'Harassment'>('Maintenance');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [showPriorityWarning, setShowPriorityWarning] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [protectedId, setProtectedId] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  
  // Feedback states
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  // Reopen states
  const [reopenReason, setReopenReason] = useState('');
  const [activeReopenId, setActiveReopenId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Dynamic filter tab state: 'all' (Registered), 'active' (Pending), 'resolved' (Resolved), 'supported' (Supported)
  // Clicking the statistic cards toggles this state!
  const [subTab, setSubTab] = useState<'all' | 'active' | 'resolved' | 'escalated' | 'supported' | 'community'>('all');

  // Synchronize sidebar tabs with internal student layout views
  React.useEffect(() => {
    if (activeTab === 'create') {
      setIsCreateOpen(true);
      setActiveTab('dashboard');
    } else if (activeTab === 'history') {
      setSubTab('resolved');
      setActiveTab('dashboard');
    }
  }, [activeTab, setActiveTab]);

  if (!currentUser) return null;

  // Filter complaints related to this student (or public complaints they can see and upvote!)
  const isOwner = (c: any) => c.studentId === currentUser.id;
  const isPublic = (c: any) => !c.anonymous;
  
  const studentViewComplaints = complaints.filter(c => isOwner(c) || isPublic(c));

  // Compute stat metrics
  const myComplaints = complaints.filter(isOwner);
  const totalSubmittedCount = myComplaints.length;
  const activeCount = myComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Verified & Closed').length;
  const resolvedCount = myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Verified & Closed').length;
  const supportedCount = complaints.filter(c => (c.supportedBy || []).includes(currentUser.id)).length;
  const escalatedCount = myComplaints.filter(c => c.status === 'Escalated').length;
  const communityCount = complaints.filter(c => !isOwner(c) && isPublic(c) && c.status !== 'Closed' && c.status !== 'Resolved' && c.status !== 'Verified & Closed').length;

  // File upload preview simulator
  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Complaint action
  const handleSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    // Smart System Validation
    const isSeriousCategory = category === 'Harassment';
    if (isSeriousCategory && priority === 'Low' && !showPriorityWarning) {
      setShowPriorityWarning(true);
      return; // Stop submission and show warning
    }

    createComplaint(
      title, 
      description, 
      category, 
      anonymous, 
      protectedId, 
      priority,
      attachment ? [attachment] : []
    );

    // Reset Form
    setTitle('');
    setDescription('');
    setCategory('Maintenance');
    setPriority('Medium');
    setShowPriorityWarning(false);
    setAnonymous(false);
    setProtectedId(false);
    setAttachment(null);
    setIsCreateOpen(false);
    setSubTab('active'); // Direct view to active
  };

  // Feedback action submission
  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackId) return;
    rateComplaintResolution(activeFeedbackId, rating, feedbackText);
    setFeedbackText('');
    setRating(5);
    setActiveFeedbackId(null);
  };

  // Reopen action submission
  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReopenId || !reopenReason) return;
    reopenComplaint(activeReopenId, reopenReason);
    setReopenReason('');
    setActiveReopenId(null);
    setSubTab('active');
  };

  // Filter complaints based on search query, category, and sub-tab selection
  const filteredComplaints = studentViewComplaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    
    let matchesSubTab = false;
    if (subTab === 'all') {
      matchesSubTab = isOwner(c);
    } else if (subTab === 'active') {
      matchesSubTab = isOwner(c) && c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Verified & Closed';
    } else if (subTab === 'resolved') {
      matchesSubTab = isOwner(c) && (c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Verified & Closed');
    } else if (subTab === 'escalated') {
      matchesSubTab = isOwner(c) && c.status === 'Escalated';
    } else if (subTab === 'supported') {
      matchesSubTab = (c.supportedBy || []).includes(currentUser.id);
    } else if (subTab === 'community') {
      matchesSubTab = !isOwner(c) && isPublic(c) && c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Verified & Closed';
    }
    
    return matchesSearch && matchesCategory && matchesSubTab;
  });

  return (
    <div className="space-y-8 animate-fadeIn relative select-none">
      
      {/* Brand Heading Row */}
      <div className="border-b border-[#121c38] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight font-sans text-glow-blue">
            Student Dashboard
          </h2>
          <p className="text-lg text-slate-400 mt-2">
            Welcome back, student. Manage your grievances and accept staff resolutions.
          </p>
        </div>

        {/* Action / Search panel inside heading row */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#030712]/40 border border-white/[0.08] focus:border-blue-500/40 rounded-xl py-3 pl-11 pr-4 text-base text-slate-200 outline-none transition-all cursor-text placeholder-slate-600"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#030712]/60 border border-white/[0.08] focus:border-blue-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none cursor-pointer font-semibold"
          >
            <option value="all">All Departments</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Lecturer / ERP / Marks">Lecturer / ERP</option>
            <option value="Harassment">Harassment</option>
          </select>
        </div>
      </div>

      {/* Quick Clickable Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'all', label: 'My Registered Cases', count: totalSubmittedCount, theme: 'blue' },
          { id: 'active', label: 'Active Pending', count: activeCount, theme: 'cyan' },
          { id: 'resolved', label: 'Total Resolved', count: resolvedCount, theme: 'emerald' },
          { id: 'supported', label: 'Supported Public Cases', count: supportedCount, theme: 'purple' }
        ].map((tab) => {
          const isActive = subTab === tab.id;
          
          let colorBorder = 'border-[#1d2d5a] hover:border-blue-500/40';
          let textColor = 'text-slate-100';
          let glowClass = 'text-glow-blue';
          let activeStyles = '';

          if (isActive) {
            if (tab.theme === 'emerald') {
              colorBorder = 'border-emerald-500/80 shadow-[0_0_22px_rgba(16,185,129,0.25)]';
              textColor = 'text-emerald-400';
              glowClass = 'text-glow-green';
              activeStyles = 'bg-emerald-500/[0.03]';
            } else if (tab.theme === 'purple') {
              colorBorder = 'border-purple-500/80 shadow-[0_0_22px_rgba(168,85,247,0.25)]';
              textColor = 'text-purple-400';
              glowClass = 'text-glow-purple';
              activeStyles = 'bg-purple-500/[0.03]';
            } else if (tab.theme === 'cyan') {
              colorBorder = 'border-cyan-500/80 shadow-[0_0_22px_rgba(6,182,212,0.25)]';
              textColor = 'text-cyan-400';
              glowClass = 'text-glow-cyan';
              activeStyles = 'bg-cyan-500/[0.03]';
            } else {
              colorBorder = 'border-blue-500/80 shadow-[0_0_22px_rgba(59,130,246,0.25)]';
              textColor = 'text-blue-400';
              glowClass = 'text-glow-blue';
              activeStyles = 'bg-blue-500/[0.03]';
            }
          }

          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`
                relative text-left rounded-2xl bg-[#090f23]/60 border p-6 shadow-lg transition-all duration-300 select-none cursor-pointer transform hover:scale-[1.04] active:scale-95 overflow-hidden group
                ${colorBorder} ${activeStyles}
              `}
            >
              {/* Highlight bar / background glow glide */}
              {isActive && (
                <motion.div 
                  layoutId="studentActiveGlow" 
                  className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-white/0 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              
              <span className="text-sm text-slate-400 font-bold uppercase tracking-wider block group-hover:text-slate-200 transition-colors">
                {tab.label}
              </span>
              <span className={`text-5xl font-black font-sans block mt-3 transition-all ${textColor} ${glowClass}`}>
                {tab.count}
              </span>

              {/* Decorative light ray on card bottom */}
              {isActive && (
                <motion.div 
                  layoutId="studentActiveLine"
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    tab.theme === 'emerald' ? 'from-emerald-500 to-teal-400' :
                    tab.theme === 'purple' ? 'from-purple-500 to-indigo-500' :
                    tab.theme === 'cyan' ? 'from-cyan-500 to-blue-400' :
                    'from-blue-500 to-indigo-500'
                  }`}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main complaint viewport and Analytics Center */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Complaints Queue */}
        <div className="xl:col-span-2 rounded-2xl bg-[#090f23]/60 border border-[#1d2d5a] p-8 space-y-8 shadow-xl relative">
          
          {/* Navigation Tabs (Fully aligned to clickable statistics filters) */}
          <div className="flex flex-wrap items-center gap-2.5 p-1.5 rounded-xl bg-[#030712]/60 border border-white/[0.08] self-start max-w-max shadow-md">
            {[
              { id: 'all', label: 'All Registered Cases', count: totalSubmittedCount },
              { id: 'active', label: 'Active Queue', count: activeCount },
              { id: 'resolved', label: 'Resolved Tickets', count: resolvedCount },
              { id: 'escalated', label: 'Escalated Breaches', count: escalatedCount },
              { id: 'supported', label: 'Supported Cases', count: supportedCount },
              { id: 'community', label: 'Community Feed', count: communityCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`
                  px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer flex items-center gap-2.5 hover:scale-[1.01] transform active:scale-98 relative
                  ${subTab === tab.id
                    ? 'bg-blue-600/20 border border-blue-500/35 text-blue-400 font-extrabold shadow-[inset_0_0_10px_rgba(59,130,246,0.15)] text-glow-blue'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }
                `}
              >
                <span>{tab.label}</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${subTab === tab.id ? 'bg-blue-500/25 text-blue-300' : 'bg-white/[0.05] text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {filteredComplaints.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="text-center py-24 border border-dashed border-white/[0.06] rounded-2xl bg-[#030712]/20"
              >
                <Inbox className="mx-auto text-slate-600 mb-4 animate-pulse" size={54} />
                <h4 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No matching cases</h4>
                <p className="text-xs text-slate-500 mt-2 font-medium">There are no active records in this specific directory index.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 pt-4"
              >
                {filteredComplaints.map(c => {
                  const owned = isOwner(c);
                  return (
                    <motion.div 
                      key={c.id}
                      layoutId={`card-${c.id}`}
                      className="p-6 rounded-2xl bg-slate-950/40 border border-[#14234c] hover:border-blue-500/20 shadow-md relative overflow-hidden transition-colors"
                    >
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-blue-500/50" />
                      
                      {/* Card header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.06] pb-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-xs font-bold text-blue-400 font-mono tracking-wider">ID: {c.id}</span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-white/[0.06]">
                              {c.category}
                            </span>
                            {c.anonymous && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                                <EyeOff size={13} /> Anonymous
                              </span>
                            )}
                            {c.protectedIdentity && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase">
                                <UserX size={13} /> Shielded ID
                              </span>
                            )}
                            {c.supportCount >= 25 && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded bg-red-500/20 border border-red-500/35 text-red-400 uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse">
                                🔥 Campus-Wide Concern
                              </span>
                            )}
                            {c.supportCount >= 10 && c.supportCount < 25 && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/35 text-amber-400 uppercase tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                                ⚡ Trending Issue
                              </span>
                            )}
                          </div>
                          <h4 className="text-2xl font-extrabold text-slate-100 tracking-wide leading-snug">{c.title}</h4>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                          <CountdownTimer endTime={c.escalationTimerEnds} status={c.status} />
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            owned 
                              ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-sm' 
                              : 'bg-white/[0.02] border-white/[0.04] text-slate-500'
                          }`}>
                            {owned ? 'My Case' : 'Public Case'}
                          </span>
                        </div>
                      </div>

                      {/* Complaint main info */}
                      <div className="space-y-4">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">{c.description}</p>
                        
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <span className="block text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">Uploaded Evidence / Supporting Attachment</span>
                            <div className="flex flex-wrap gap-3">
                              {c.attachments.map((img: string, idx: number) => (
                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/[0.08] bg-slate-900/60 p-1.5 max-w-md shadow-md transition-all hover:border-blue-500/30">
                                  <img src={img} alt="Evidence base64" className="rounded-lg object-contain max-h-64 w-full" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/[0.03] text-xs font-mono tracking-wide">
                          <div>
                            <span className="block text-slate-500 font-bold uppercase mb-0.5">Status</span>
                            <span className={`font-extrabold ${
                              c.status === 'Resolved' || c.status === 'Closed' ? 'text-emerald-400' : 'text-blue-400'
                            }`}>{c.status}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 font-bold uppercase mb-0.5">Assigned Target</span>
                            <span className="text-slate-300 font-semibold">{c.assignedTeacherName}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 font-bold uppercase mb-0.5">Reported On</span>
                            <span className="text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 font-bold uppercase mb-0.5">Priority</span>
                            {c.priority === 'Critical' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse font-black text-[10px] uppercase tracking-wider">
                                <AlertTriangle size={12} /> CRITICAL
                              </span>
                            ) : c.priority === 'High' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)] font-bold text-[10px] uppercase tracking-wider">
                                HIGH
                              </span>
                            ) : c.priority === 'Medium' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                                MEDIUM
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                                LOW
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action responses, remarks, warnings, or timeline reviews */}
                      {c.remarks && (
                        <div className="mt-4 p-4 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 text-xs">
                          <span className="block text-blue-400 font-extrabold uppercase tracking-wider mb-1">Faculty Official Remarks</span>
                          <p className="text-slate-300 font-medium leading-relaxed">"{c.remarks}"</p>
                        </div>
                      )}

                      {/* Card bottom actions bar */}
                      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-2 text-base font-semibold">
                        <div className="flex items-center gap-3">
                          {c.anonymous || c.protectedIdentity || owned ? (
                            <button
                              disabled
                              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] text-[10px] text-slate-500 font-black uppercase tracking-wide opacity-50 cursor-not-allowed"
                            >
                              <ThumbsUp size={13} className="shrink-0" />
                              <span>Support Disabled</span>
                            </button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: (c.supportedBy || []).includes(currentUser.id) ? '0 0 20px rgba(59, 130, 246, 0.6)' : '0 0 12px rgba(59, 130, 246, 0.25)' }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => supportComplaint(c.id)}
                              disabled={(c.supportedBy || []).includes(currentUser.id)}
                              className={`
                                flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all shadow-sm
                                ${(c.supportedBy || []).includes(currentUser.id)
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.45)] cursor-default'
                                  : 'bg-transparent border-blue-500/40 hover:border-blue-500 text-blue-400 hover:text-blue-300 cursor-pointer'
                                }
                              `}
                            >
                              {(c.supportedBy || []).includes(currentUser.id) ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                  <CheckCircle size={13} className="text-white shrink-0" />
                                </motion.div>
                              ) : (
                                <ThumbsUp size={13} className="shrink-0 hover:animate-bounce" />
                              )}
                              <span>{(c.supportedBy || []).includes(currentUser.id) ? 'Supported' : 'Support'}</span>
                            </motion.button>
                          )}
                          <span className="text-slate-400 font-mono text-sm flex items-center gap-1.5">
                            <AnimatePresence mode="popLayout">
                              <motion.span 
                                key={c.supportCount || 0}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="font-bold text-slate-200"
                              >
                                {c.supportCount || 0}
                              </motion.span>
                            </AnimatePresence>
                            <span>students supported this</span>
                          </span>
                        </div>

                        {/* Feedback and reopen triggers for Owner */}
                        {owned && c.status === 'Resolved' && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setActiveReopenId(c.id)}
                              className="py-2.5 px-4.5 rounded-xl border border-rose-500/35 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 transform shadow-md"
                            >
                              <RotateCcw size={14} />
                              <span>Reopen ticket</span>
                            </button>
                            <button
                              onClick={() => setActiveFeedbackId(c.id)}
                              className="py-2.5 px-4.5 rounded-xl border border-emerald-500/35 hover:border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 animate-pulse hover:scale-105 active:scale-95 transform shadow-md"
                            >
                              <CheckCircle2 size={14} />
                              <span>Accept & Close</span>
                            </button>
                          </div>
                        )}

                        {owned && (c.status === 'Resolved' || c.status === 'Closed') && (
                          <div className="flex items-center gap-3">
                            {c.status === 'Closed' && c.feedbackRating && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 font-bold uppercase tracking-wider shadow-sm">
                                <span className="text-amber-400">★ {c.feedbackRating}/5</span> - Case Closed
                              </div>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to permanently delete your complaint from the university database? This action cannot be undone.")) {
                                  deleteComplaint(c.id);
                                }
                              }}
                              className="py-1.5 px-3 rounded-xl border border-rose-500/35 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 transform shadow-md"
                              title="Permanently Delete Complaint"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Column: Support Analytics Panel */}
        <div className="space-y-6">
          
          {/* Trending Concerns Widget */}
          <div className="rounded-2xl bg-[#090f23]/60 border border-[#1d2d5a] p-6 shadow-xl space-y-5">
            <h3 className="text-base font-black text-slate-100 border-b border-white/[0.06] pb-3 flex items-center gap-2">
              <span className="text-glow-amber text-amber-400 font-sans">⚡</span> Trending Concerns
            </h3>
            
            <div className="space-y-4">
              {complaints
                .filter(c => !c.anonymous && !c.protectedIdentity && c.status !== 'Closed')
                .sort((a, b) => b.supportCount - a.supportCount)
                .slice(0, 3)
                .map(c => {
                  const alreadySupported = (c.supportedBy || []).includes(currentUser.id);
                  const owned = c.studentId === currentUser.id;
                  return (
                    <div key={c.id} className="p-4 bg-[#030712]/50 border border-white/[0.04] rounded-xl space-y-2.5 hover:border-blue-500/25 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">{c.id}</span>
                        {owned ? (
                          <span className="text-[9px] text-slate-400/60 font-mono font-bold border border-white/[0.04] px-2 py-0.5 rounded bg-white/[0.02]">
                            My Grievance
                          </span>
                        ) : (
                          <button
                            onClick={() => supportComplaint(c.id)}
                            disabled={alreadySupported}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              alreadySupported
                                ? 'bg-blue-600 border-blue-500 text-white shadow-sm cursor-default'
                                : 'bg-transparent border-blue-500/40 hover:border-blue-500 text-blue-400 hover:text-blue-300 hover:scale-105 active:scale-95'
                            }`}
                          >
                            <ThumbsUp size={10} />
                            <span>{alreadySupported ? 'Supported' : 'Support'}</span>
                          </button>
                        )}
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-200 truncate">{c.title}</h4>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-bold uppercase">
                        <span>{c.category}</span>
                        <span className="text-blue-400 font-extrabold">{c.supportCount || 0} Upvotes</span>
                      </div>
                    </div>
                  );
                })}
              {complaints.filter(c => !c.anonymous && !c.protectedIdentity).length === 0 && (
                <p className="text-xs text-slate-500 italic py-2 text-center">No trending public concerns found.</p>
              )}
            </div>
          </div>

          {/* Trending Analytics breakdown */}
          <div className="rounded-2xl bg-[#090f23]/60 border border-[#1d2d5a] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-100 border-b border-white/[0.06] pb-3">
              Most Supported Categories
            </h3>
            <div className="space-y-3.5 pt-1">
              {[
                { label: 'Maintenance', count: complaints.filter(c => c.category === 'Maintenance').reduce((acc, curr) => acc + curr.supportCount, 0), color: 'bg-rose-500' },
                { label: 'Lecturer / ERP / Marks', count: complaints.filter(c => c.category === 'Lecturer / ERP / Marks').reduce((acc, curr) => acc + curr.supportCount, 0), color: 'bg-indigo-500' },
                { label: 'Harassment', count: complaints.filter(c => c.category === 'Harassment').reduce((acc, curr) => acc + curr.supportCount, 0), color: 'bg-purple-500' }
              ].sort((a, b) => b.count - a.count).map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>{item.label}</span>
                    <span>{item.count} Votes</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#030712] rounded-full overflow-hidden border border-white/[0.03]">
                    <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, (item.count / (complaints.reduce((a, b) => a + b.supportCount, 0) || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* FIXED Floating Plus Button (Triggers modern registration modal) */}
      <button 
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_4px_25px_rgba(59,130,246,0.45)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer group"
        title="Register New Grievance"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Modern Complaint Submission Modal Popup */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Institutional Grievance"
        size="lg"
      >
        <form onSubmit={handleSubmitGrievance} className="space-y-6 animate-scaleUp">
          
          {/* Category selector preset cards */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Assigned Target Department</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { val: 'Maintenance', label: 'Maintenance Team', desc: 'Hostels, electricals, infrastructure concerns' },
                { val: 'Lecturer / ERP / Marks', label: 'Lecturer / ERP', desc: 'Assessments, portals, schedules logs' },
                { val: 'Harassment', label: 'Grievance Team', desc: 'Ragging, safety, compliance cases' }
              ].map((catItem) => (
                <div
                  key={catItem.val}
                  onClick={() => {
                    setCategory(catItem.val as any);
                    setShowPriorityWarning(false);
                    if (catItem.val === 'Harassment' && priority === 'Low') {
                      setPriority('Critical');
                    }
                  }}
                  className={`
                    p-4 rounded-2xl border text-xs text-left cursor-pointer transition-all flex flex-col justify-between h-28 bg-slate-950/80 hover:scale-[1.02] transform duration-300
                    ${category === catItem.val
                      ? 'bg-blue-600/10 border-blue-500/40 text-blue-300 font-bold shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                      : 'border-white/[0.08] text-slate-400 hover:border-blue-500/20'
                    }
                  `}
                >
                  <span className="block font-black tracking-wide text-sm">{catItem.label}</span>
                  <span className="block text-xs text-slate-500 leading-relaxed mt-1.5">{catItem.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Complaint Priority</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { val: 'Low', label: 'Low', color: 'blue', desc: 'Minor issue, non-urgent' },
                { val: 'Medium', label: 'Medium', color: 'amber', desc: 'Standard grievance' },
                { val: 'High', label: 'High', color: 'orange', desc: 'Major issue, urgent' },
                { val: 'Critical', label: 'Critical', color: 'red', desc: 'Emergency, safety threat' }
              ].map((p) => {
                const isActive = priority === p.val;
                return (
                  <div
                    key={p.val}
                    onClick={() => { setPriority(p.val as any); setShowPriorityWarning(false); }}
                    className={`
                      p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-24 bg-slate-950/80 hover:scale-[1.02] transform duration-300
                      ${isActive 
                        ? p.color === 'blue' ? 'bg-blue-600/10 border-blue-500/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)]' :
                          p.color === 'amber' ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                          p.color === 'orange' ? 'bg-orange-500/10 border-orange-500/40 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.1)]' :
                          'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
                        : 'border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                      }
                    `}
                  >
                    <span className="block font-black tracking-wide text-sm">{p.label}</span>
                    <span className="block text-[10px] text-slate-500 leading-relaxed mt-1">{p.desc}</span>
                  </div>
                );
              })}
            </div>
            {category === 'Harassment' && priority !== 'Critical' && (
               <p className="text-xs text-amber-400 mt-2 font-bold flex items-center gap-1.5"><AlertTriangle size={14}/> System Recommendation: Serious categories like Harassment usually require Critical Priority.</p>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Grievance Summary Header</label>
            <input
              type="text"
              required
              placeholder="Short descriptive summary concern (e.g. WiFi outage in Block A)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-white/[0.08] focus:border-blue-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none transition-all cursor-text placeholder-slate-600"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Factual Details</label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact facts, locations, and descriptions. Be clear and respectful."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-white/[0.08] focus:border-blue-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none transition-all leading-relaxed resize-none cursor-text placeholder-slate-600"
            />
          </div>

          {/* File Upload simulator */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Factual Proof / Image Attachments</label>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex flex-col items-center justify-center border border-dashed border-white/[0.08] hover:border-blue-500/40 rounded-2xl w-28 h-24 bg-slate-950 hover:bg-white/[0.02] transition-all cursor-pointer group shrink-0">
                <Upload size={18} className="text-slate-500 group-hover:text-blue-400 group-hover:scale-105 transition-all" />
                <span className="text-xs text-slate-500 mt-1.5 font-bold">Add Proof</span>
                <input type="file" accept="image/*" onChange={handleFileUploadMock} className="hidden" />
              </label>
              
              {attachment && (
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#030712] w-28 h-24 group shrink-0 shadow-md">
                  <img src={attachment} alt="Evidence Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setAttachment(null)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm font-bold text-rose-400 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Controls toggles */}
          <div className="space-y-2 border-t border-white/[0.06] pt-5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Privacy & Feed Visibility</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Standard Public Card */}
              <div 
                onClick={() => {
                  setAnonymous(false);
                  setProtectedId(false);
                }}
                className={`
                  p-4 rounded-2xl border text-xs cursor-pointer select-none transition-all flex items-start gap-3 bg-slate-950/80 hover:scale-[1.02] transform duration-300
                  ${!anonymous && !protectedId
                    ? 'bg-blue-500/5 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.05)]'
                    : 'border-white/[0.08] text-slate-400 hover:border-blue-500/20'
                  }
                `}
              >
                <ThumbsUp size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold">Standard Public</span>
                  <span className="block text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Visible on public feeds. Allows upvotes/support to auto-escalate priority.
                  </span>
                </div>
              </div>

              {/* Anonymous submits */}
              <div 
                onClick={() => {
                  setAnonymous(true);
                  setProtectedId(false);
                }}
                className={`
                  p-4 rounded-2xl border text-xs cursor-pointer select-none transition-all flex items-start gap-3 bg-slate-950/80 hover:scale-[1.02] transform duration-300
                  ${anonymous
                    ? 'bg-amber-500/5 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
                    : 'border-white/[0.08] text-slate-400 hover:border-amber-500/20'
                  }
                `}
              >
                <EyeOff size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold">Anonymous</span>
                  <span className="block text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Completely hide identity. Excluded from upvote feed for security.
                  </span>
                </div>
              </div>

              {/* Identity Shield submits */}
              <div 
                onClick={() => {
                  setAnonymous(false);
                  setProtectedId(true);
                }}
                className={`
                  p-4 rounded-2xl border text-xs cursor-pointer select-none transition-all flex items-start gap-3 bg-slate-950/80 hover:scale-[1.02] transform duration-300
                  ${protectedId && !anonymous
                    ? 'bg-purple-500/5 border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.05)]'
                    : 'border-white/[0.08] text-slate-400 hover:border-purple-500/20'
                  }
                `}
              >
                <UserX size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold">Identity Shield</span>
                  <span className="block text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Hide name from teachers. Only Systems Director (Admin) can decrypt.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action submit row */}
          {showPriorityWarning && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold flex items-start gap-3 animate-fadeIn">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="block font-black uppercase tracking-wider text-rose-400 mb-1">Warning: Low Priority selected for critical category</span>
                <p className="text-xs text-rose-300/80 leading-relaxed mb-3">You have selected 'Low' priority for Harassment/Safety. Are you sure you want to proceed, or upgrade to Critical?</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setPriority('Critical'); setShowPriorityWarning(false); }} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-[0_0_15px_rgba(225,29,72,0.4)]">Upgrade to Critical</button>
                  <button type="button" onClick={() => { setShowPriorityWarning(false); }} className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold transition-all">Keep Low Priority</button>
                </div>
              </div>
            </div>
          )}
          <div className="border-t border-white/[0.06] pt-5 flex items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="py-3 px-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white text-sm font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 transform"
            >
              Discard
            </button>
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transform"
            >
              <Send size={15} />
              <span>Submit ticket</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Rating resolution & closing */}
      <Modal
        isOpen={activeFeedbackId !== null}
        onClose={() => setActiveFeedbackId(null)}
        title="Close Grievance & Lock Resolution"
      >
        <form onSubmit={handleRatingSubmit} className="space-y-6 animate-scaleUp">
          <div className="text-center">
            <p className="text-base text-slate-400 leading-relaxed">
              Rate the speed and effectiveness of this resolution. Your review completes the ticket audit.
            </p>
          </div>

          {/* Star selector */}
          <div className="flex items-center justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-4xl cursor-pointer hover:scale-110 transition-transform ${
                  star <= rating ? 'text-amber-400' : 'text-slate-700'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Feedback comments */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Optional comments</label>
            <textarea
              rows={3}
              placeholder="What could have been improved? Any thank you messages?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full bg-slate-950 border border-white/[0.08] focus:border-blue-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none leading-relaxed resize-none cursor-text placeholder-slate-600"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setActiveFeedbackId(null)}
              className="py-3 px-5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-slate-300 text-sm font-semibold cursor-pointer hover:scale-105 active:scale-95 transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold cursor-pointer hover:scale-105 active:scale-95 transform shadow-md"
            >
              Confirm resolution
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reopen Complaint ticket */}
      <Modal
        isOpen={activeReopenId !== null}
        onClose={() => setActiveReopenId(null)}
        title="Reopen Grievance Case"
      >
        <form onSubmit={handleReopenSubmit} className="space-y-6 animate-scaleUp">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs leading-relaxed font-semibold">
            <AlertTriangle className="shrink-0 mt-0.5 animate-pulse" size={18} />
            <p>
              Reopening immediately restores status to **In Progress** and resets the **24-hour escalation timer**. Reopened cases trigger high-priority alerts.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Mandatory Reopen Reason</label>
            <textarea
              required
              rows={3}
              placeholder="Please explain exactly why this resolution is unsatisfactory..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full bg-slate-950 border border-white/[0.08] focus:border-rose-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none leading-relaxed resize-none cursor-text placeholder-slate-600"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setActiveReopenId(null)}
              className="py-3 px-5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-slate-300 text-sm font-semibold cursor-pointer hover:scale-105 active:scale-95 transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-3 px-6 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold cursor-pointer hover:scale-105 active:scale-95 transform shadow-md"
            >
              Reopen Case
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
