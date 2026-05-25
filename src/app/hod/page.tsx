'use client';

import React, { useState } from 'react';
import { usePortal } from '@/context/PortalContext';
import { GlowCard } from '@/components/GlowCard';
import { ComplaintTimeline } from '@/components/ComplaintTimeline';
import { CategoryDonutChart, HorizontalPerformanceChart } from '@/components/AnalyticsCharts';
import { Modal } from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  EyeOff, 
  Activity, 
  ShieldCheck, 
  Eye, 
  Clock, 
  AlertOctagon, 
  Award, 
  Compass, 
  Layout, 
  BookOpen, 
  RefreshCw, 
  Plus, 
  FileText, 
  UserX, 
  Clipboard, 
  Sliders, 
  Lock, 
  CheckCircle,
  HelpCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

interface SubDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function HodDashboard({ activeTab, setActiveTab }: SubDashboardProps) {
  const { complaints, activityLogs, updateComplaintFields, updateComplaintPriority, addActivityLog } = usePortal();

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Modal open states for HOD powers
  const [warningModalId, setWarningModalId] = useState<string | null>(null);
  const [warningReason, setWarningReason] = useState('');
  const [warningRemark, setWarningRemark] = useState('Needs Improvement');
  const [warningExtension, setWarningExtension] = useState('No Extension');

  const [clarifyModalId, setClarifyModalId] = useState<string | null>(null);
  const [clarifyQuery, setClarifyQuery] = useState('');

  const [priorityModalId, setPriorityModalId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');

  const [notesModalId, setNotesModalId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // Core metrics for the HOD Dashboard (restricted strictly to HOD's department 'Lecturer / ERP / Marks')
  const HOD_DEPT_CATEGORY = 'Lecturer / ERP / Marks';
  const deptComplaints = complaints.filter(c => c.category === HOD_DEPT_CATEGORY);

  const totalCount = deptComplaints.length;
  const pendingReviewsCount = deptComplaints.filter(c => c.status === 'Pending HOD Verification' || c.status === 'Returned For Rework').length;
  const escalatedCount = deptComplaints.filter(c => c.status === 'Escalated' || c.escalatedToAdmin).length;
  const slaViolationsCount = deptComplaints.filter(c => {
    const elapsed = Date.now() - new Date(c.createdAt).getTime();
    return elapsed > 24 * 60 * 60 * 1000 && c.status !== 'Verified & Closed' && c.status !== 'Closed';
  }).length;
  
  // Faculty average efficiency score
  const teacherPerformanceScore = 91.8;
  const criticalCount = deptComplaints.filter(c => c.priority === 'Critical').length;

  // Filtered grievances list based on active view filters (within department scope)
  const filteredComplaints = deptComplaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'pending_reviews') {
      matchesStatus = c.status === 'Pending HOD Verification' || c.status === 'Returned For Rework';
    } else if (statusFilter === 'escalated') {
      matchesStatus = c.status === 'Escalated' || c.escalatedToAdmin === true;
    } else if (statusFilter === 'sla_violations') {
      const elapsed = Date.now() - new Date(c.createdAt).getTime();
      matchesStatus = elapsed > 24 * 60 * 60 * 1000 && c.status !== 'Verified & Closed' && c.status !== 'Closed';
    } else if (statusFilter === 'critical') {
      matchesStatus = c.priority === 'Critical';
    } else if (statusFilter !== 'all') {
      matchesStatus = c.status === statusFilter;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    const priorityWeight: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
  });

  const selectedComplaint = deptComplaints.find(c => c.id === selectedComplaintId);

  // Helper: Strictly redact student identities (HOD MUST NEVER SEE STUDENT DETAILS)
  const getMaskedStudentName = (c: any) => {
    if (c.anonymous) {
      return (
        <span className="text-purple-400 font-extrabold uppercase tracking-wider inline-flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-[10px]">
          Anonymous Student
        </span>
      );
    }
    return (
      <span className="text-cyan-400 font-extrabold uppercase tracking-wider inline-flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 text-[10px]">
        <EyeOff size={11} /> Protected Identity
      </span>
    );
  };

  // HOD POWER: Issue Warning to Teacher
  const handleWarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningModalId || !warningReason) return;

    const target = complaints.find(c => c.id === warningModalId);
    if (!target) return;

    const newWarning = {
      id: `warn-${Date.now()}`,
      reason: warningReason,
      remark: warningRemark,
      extension: warningExtension,
      timestamp: new Date().toISOString()
    };

    updateComplaintFields(warningModalId, {
      warnings: [...(target.warnings || []), newWarning]
    });

    addActivityLog(
      warningModalId,
      'Warning Notice Issued',
      `HOD issued warning to ${target.assignedTeacherName}. Notice: ${warningReason}. Performance Remark: ${warningRemark}`
    );

    setWarningModalId(null);
    setWarningReason('');
    alert('Warning notice issued to assigned faculty member. Notification dispatched.');
  };

  // HOD POWER: Request Clarification from Teacher
  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarifyModalId || !clarifyQuery) return;

    const target = complaints.find(c => c.id === clarifyModalId);
    if (!target) return;

    const newRequest = {
      id: `query-${Date.now()}`,
      query: clarifyQuery,
      timestamp: new Date().toISOString()
    };

    updateComplaintFields(clarifyModalId, {
      clarificationRequests: [...(target.clarificationRequests || []), newRequest]
    });

    addActivityLog(
      clarifyModalId,
      'Clarification Requested',
      `HOD requested status clarification from teacher: "${clarifyQuery}"`
    );

    setClarifyModalId(null);
    setClarifyQuery('');
    alert('Progress clarification request dispatched to assigned faculty member.');
  };

  // HOD POWER: Freeze Complaint Closure
  const handleToggleFreeze = (id: string) => {
    const target = complaints.find(c => c.id === id);
    if (!target) return;

    const newFrozenState = !target.isFrozen;
    updateComplaintFields(id, {
      isFrozen: newFrozenState,
      status: newFrozenState ? 'Pending HOD Review' : 'In Progress'
    });

    addActivityLog(
      id,
      newFrozenState ? 'Complaint Frozen' : 'Complaint Unfrozen',
      newFrozenState 
        ? 'HOD froze complaint closure, transitioning status to Pending HOD Review.' 
        : 'HOD unfroze complaint, returning status to In Progress.'
    );

    alert(newFrozenState 
      ? 'Complaint frozen. Teacher is restricted from closing this complaint pending your formal audit.' 
      : 'Complaint unfroze. Faculty is authorized to resume standard closure pipelines.'
    );
  };

  // HOD POWER: Priority Monitoring Override
  const handlePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityModalId) return;

    updateComplaintPriority(priorityModalId, selectedPriority);

    setPriorityModalId(null);
    alert(`Complaint priority adjusted to ${selectedPriority} successfully.`);
  };

  // HOD POWER: Internal Notes Commits
  const handleNotesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesModalId) return;

    updateComplaintFields(notesModalId, {
      hodNotes: tempNotes
    });

    addActivityLog(
      notesModalId,
      'Internal Notes Saved',
      'HOD appended private supervisor remarks to case logs.'
    );

    setNotesModalId(null);
    alert('Internal HOD supervisor notes successfully locked in.');
  };

  // HOD POWER: Resolution Quality Audits (Approve / Reject)
  const handleApproveResolution = (complaintId: string) => {
    updateComplaintFields(complaintId, {
      status: 'Verified & Closed',
      isFrozen: false
    });

    addActivityLog(
      complaintId,
      'Resolution Verified & Closed',
      'HOD audited, approved, and verified the faculty resolution. Case formally Verified & Closed.'
    );

    alert('Resolution verified, approved, and signed off. Complaint has transitioned to Verified & Closed.');
  };

  const handleRejectResolutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalId || !rejectFeedback) return;

    updateComplaintFields(rejectModalId, {
      status: 'Returned For Rework',
      isFrozen: false,
      resolutionDetails: '',
      hodNotes: `Resolution rejected: "${rejectFeedback}"`
    });

    addActivityLog(
      rejectModalId,
      'Returned For Rework',
      `HOD rejected the resolution and returned the case to the teacher for rework. Feedback: "${rejectFeedback}"`
    );

    setRejectModalId(null);
    setRejectFeedback('');
    alert('Resolution rejected. Complaint has been returned to the teacher queue for rework.');
  };

  // Filter HOD Activity Feed logs specifically (restricted strictly to HOD's department scope and audited actions)
  const hodActivityLogs = activityLogs.filter(log => {
    const isDeptComplaint = deptComplaints.some(c => c.id === log.complaintId);
    return isDeptComplaint && (
      log.userRole === 'hod' || 
      log.action === 'Escalated to Admin' || 
      log.action === 'Warning Notice Issued' || 
      log.action === 'Clarification Requested' || 
      log.action === 'Complaint Frozen' || 
      log.action === 'Complaint Unfrozen' || 
      log.action === 'Priority Increased' ||
      log.action === 'Resolution Approved' ||
      log.action === 'Resolution Rejected'
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100 select-none pb-12">
      
      {/* Brand Heading Row */}
      <div className="border-b border-emerald-900 pb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-pulse">
              <ShieldCheck size={14} /> Department Head Oversight Engaged
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight font-sans text-glow-green flex items-center gap-3 mt-2">
            <BookOpen className="text-emerald-400" size={38} />
            <span>Academic HOD Monitor</span>
          </h2>
          <p className="text-base text-slate-400 mt-2 font-medium">
            Review teacher resolution pipelines, track SLA compliance, escalate critical events, and audit faculty ratings. <span className="text-emerald-400 font-bold">(Lecturer / ERP / Marks Division)</span>
          </p>
        </div>

        {/* Exclusive HOD Access Card */}
        <div className="shrink-0 p-4.5 rounded-2xl bg-emerald-950/15 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] flex items-center gap-4.5 max-w-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Scope of Authority</span>
            <h4 className="text-[15px] font-black text-emerald-300 mt-0.5 tracking-wide">Single Department Oversight</h4>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-bold uppercase mt-1.5 inline-block">
              Lecturer / ERP / Marks
            </span>
          </div>
        </div>
      </div>

      {/* Realistic HOD Analytics Counts Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
        
        {/* Card 1: Total Department Complaints */}
        <div 
          onClick={() => {
            setStatusFilter('all');
            setActiveTab('dashboard');
          }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'all' && activeTab === 'dashboard'
              ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.18)] bg-emerald-950/10'
              : 'border-slate-800/80 hover:border-emerald-500/40'
          }`}
        >
          <div className="absolute top-4 right-4 text-emerald-400/30">
            <Clipboard size={18} />
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Department Cases</span>
          <span className="text-3xl font-black font-sans text-emerald-400 block mt-2 text-glow-green">{totalCount}</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Total active queue load</span>
        </div>

        {/* Card 2: Pending HOD Reviews */}
        <div 
          onClick={() => {
            setStatusFilter('pending_reviews');
            setActiveTab('dashboard');
          }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'pending_reviews' && activeTab === 'dashboard'
              ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.18)] bg-purple-950/10'
              : 'border-slate-800/80 hover:border-purple-500/40'
          }`}
        >
          <div className="absolute top-4 right-4 text-purple-400/30">
            <Lock size={18} />
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pending Reviews</span>
          <span className="text-3xl font-black font-sans text-purple-400 block mt-2 text-glow-purple">{pendingReviewsCount}</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Frozen cases locked</span>
        </div>

        {/* Card 3: Escalated Cases */}
        <div 
          onClick={() => {
            setStatusFilter('escalated');
            setActiveTab('dashboard');
          }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'escalated' && activeTab === 'dashboard'
              ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.18)] bg-red-950/10'
              : 'border-slate-800/80 hover:border-red-500/40'
          }`}
        >
          <div className="absolute top-4 right-4 text-red-400/30">
            <AlertOctagon size={18} />
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Escalated Cases</span>
          <span className="text-3xl font-black font-sans text-red-400 block mt-2 text-glow-red">{escalatedCount}</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Forwarded to Admin</span>
        </div>

        {/* Card 4: SLA Violations */}
        <div 
          onClick={() => {
            setStatusFilter('sla_violations');
            setActiveTab('dashboard');
          }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'sla_violations' && activeTab === 'dashboard'
              ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.18)] bg-amber-950/10'
              : 'border-slate-800/80 hover:border-amber-500/40'
          }`}
        >
          <div className="absolute top-4 right-4 text-amber-500/30">
            <Clock size={18} />
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">SLA Violations</span>
          <span className="text-3xl font-black font-sans text-amber-400 block mt-2 text-glow-amber">{slaViolationsCount}</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Delayed past 24 hours</span>
        </div>

        {/* Card 5: Teacher Efficiency Score */}
        <div 
          onClick={() => setActiveTab('faculty')}
          className="p-5 rounded-2xl bg-[#090f23]/60 border border-slate-800/80 transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative hover:border-emerald-500/40"
        >
          <div className="absolute top-4 right-4 text-emerald-400/30">
            <Award size={18} />
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Faculty Score</span>
          <span className="text-3xl font-black font-sans text-emerald-400 block mt-2 text-glow-green">{teacherPerformanceScore}%</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Resolution compliance rate</span>
        </div>

        {/* Card 6: Critical Complaints */}
        <div 
          onClick={() => {
            setStatusFilter('critical');
            setActiveTab('dashboard');
          }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'critical' && activeTab === 'dashboard'
              ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.18)] bg-orange-950/10'
              : 'border-slate-800/80 hover:border-orange-500/40'
          }`}
        >
          <div className="absolute top-4 right-4 text-orange-400/30">
            <AlertCircle size={18} />
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Critical Cases</span>
          <span className="text-3xl font-black font-sans text-orange-500 block mt-2 text-glow-amber">{criticalCount}</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Requires immediate review</span>
        </div>

      </div>

      {/* Main Tab Render Grid Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* TAB 1: DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Privacy Warning Banner */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 text-sm leading-relaxed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-400 block uppercase">Supervisory Integrity Protocol (MANDATORY)</span>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Student roll numbers, names, emails, and contact details are strictly redacted for all complaint categories.</p>
                  </div>
                </div>
                <span className="hidden md:inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-black uppercase font-mono tracking-widest select-none">
                  INTEGRITY ACTIVE
                </span>
              </div>

              {/* Active Departmental Oversight Log Table */}
              <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-200">Department Oversight Logs</h3>
                    <p className="text-xs text-slate-500 mt-1">Supervise teacher assignments, check warnings, and trigger operational HOD overrides.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {(statusFilter !== 'all' || filterCategory !== 'all' || searchQuery !== '') && (
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setFilterCategory('all');
                          setSearchQuery('');
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-800/40"
                      >
                        <RefreshCw size={12} />
                        <span>Reset Filters</span>
                      </button>
                    )}

                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 outline-none cursor-pointer font-bold focus:border-indigo-500/40"
                    >
                      <option value="all">All Categories</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Lecturer / ERP / Marks">Lecturer / ERP</option>
                      <option value="Harassment">Harassment</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 outline-none cursor-pointer font-bold focus:border-indigo-500/40"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Seen">Seen</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending HOD Review">Pending HOD Review</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Table search filter bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                  <input
                    type="text"
                    placeholder="Search departmental logs by ID, keywords, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 focus:border-indigo-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-300 outline-none placeholder-slate-600 font-medium"
                  />
                </div>

                {/* Complaint oversight grid list */}
                <div className="space-y-4">
                  {filteredComplaints.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => setSelectedComplaintId(c.id)}
                      className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-indigo-500/35 hover:scale-[1.002] transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-indigo-400 font-mono uppercase">{c.id}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase">{c.category}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                            c.status === 'Resolved' || c.status === 'Closed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : c.status === 'Escalated'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                                : c.status === 'Pending HOD Review'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>{c.status}</span>
                          {c.priority === 'Critical' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse font-black uppercase">
                              <AlertTriangle size={10} /> CRITICAL
                            </span>
                          ) : c.priority === 'High' ? (
                            <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold uppercase">
                              HIGH
                            </span>
                          ) : c.priority === 'Medium' ? (
                            <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase">
                              MEDIUM
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase">
                              LOW
                            </span>
                          )}
                          {c.isFrozen && (
                            <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              LOCKED / FROZEN
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-base font-bold text-slate-200 truncate">{c.title}</h4>
                        
                        <div className="text-xs text-slate-500 font-semibold flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>Department Filer:</span> 
                          {getMaskedStudentName(c)}
                          <span>•</span>
                          <span>Assigned Teacher: <strong className="text-slate-400 font-bold">{c.assignedTeacherName}</strong></span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-indigo-400 hover:text-indigo-300 shrink-0 uppercase tracking-wider flex items-center gap-1 bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-800/40 transition-colors">
                        <Eye size={12} /> Supervise Case
                      </span>
                    </div>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-slate-850 rounded-xl bg-[#030712]/30">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">No complaints found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEACHER PERFORMANCE */}
          {activeTab === 'faculty' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workload Distribution Chart */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Award size={18} className="text-emerald-400" />
                    <span>Academic Division Workload Distribution</span>
                  </h3>
                  <div className="py-4">
                    <HorizontalPerformanceChart data={[
                      { 
                         label: 'Prof. Kashif Sheikh (Academics / Marks)', 
                         resolved: complaints.filter(c => c.assignedTeacherId === 'usr-t1' && (c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Verified & Closed')).length,
                         total: complaints.filter(c => c.assignedTeacherId === 'usr-t1').length,
                         color: '#10b981' 
                      }
                    ]} />
                  </div>
                </div>

                {/* Faculty Performance Card details */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                      <Clock size={18} className="text-emerald-400 text-glow-green" />
                      <span>Faculty Audit & Warnings</span>
                    </h3>

                    <div className="space-y-4 pt-2 mt-2">
                      {[
                        { id: 'usr-t1', name: 'Prof. Kashif Sheikh', dept: 'Academics / Marks' }
                      ].map((t) => {
                        const total = deptComplaints.filter(c => c.assignedTeacherId === t.id).length;
                        const warnings = deptComplaints.filter(c => c.assignedTeacherId === t.id).flatMap(c => c.warnings || []);
                        const activeCount = deptComplaints.filter(c => c.assignedTeacherId === t.id && c.status !== 'Verified & Closed' && c.status !== 'Closed').length;
                        return (
                          <div key={t.id} className="flex flex-col gap-4 p-4 bg-[#030712]/50 border border-slate-850 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="block text-sm font-bold text-slate-350">{t.name}</span>
                                <span className="block text-[11px] text-slate-500 font-semibold font-mono mt-0.5">{t.dept}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const caseOfTeacher = deptComplaints.find(c => c.assignedTeacherId === t.id && c.status !== 'Verified & Closed' && c.status !== 'Closed');
                                  if (caseOfTeacher) {
                                    setWarningModalId(caseOfTeacher.id);
                                  } else {
                                    alert('No active unresolved complaints assigned to this teacher to issue warnings against.');
                                  }
                                }}
                                className="py-1.5 px-3 rounded-lg bg-red-950/20 border border-red-800/40 hover:bg-red-950/40 text-red-400 text-xs font-bold transition-all cursor-pointer"
                              >
                                Issue warning
                              </button>
                            </div>
                            
                            {/* Rich metrics inside faculty performance */}
                            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-900 pt-3">
                              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900">
                                <span className="text-[10px] text-slate-500 block uppercase font-mono">Efficiency Rating</span>
                                <strong className="text-emerald-400 text-sm font-bold mt-1 block">93.5% Score</strong>
                              </div>
                              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900">
                                <span className="text-[10px] text-slate-500 block uppercase font-mono">Avg Resolution Time</span>
                                <strong className="text-emerald-400 text-sm font-bold mt-1 block">12.2 Hours</strong>
                              </div>
                              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900">
                                <span className="text-[10px] text-slate-500 block uppercase font-mono">Faculty Response Rate</span>
                                Strong (96.8%)
                              </div>
                              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900">
                                <span className="text-[10px] text-slate-500 block uppercase font-mono">Active Workload</span>
                                <strong className="text-indigo-400 text-sm font-bold mt-1 block">{activeCount} Cases Pending</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PENDING VERIFICATION */}
          {activeTab === 'reviews' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-slate-200">Grievance Quality Verification Pipeline</h3>
                <p className="text-xs text-slate-500 mt-1">Audit faculty resolution plans. Formal validation is required before cases can transition to Verified & Closed.</p>
              </div>

              <div className="space-y-4">
                {deptComplaints.filter(c => c.status === 'Pending HOD Verification' || c.status === 'Returned For Rework' || c.isFrozen).map(c => (
                  <div key={c.id} className="p-5 rounded-xl bg-emerald-950/5 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400">{c.id}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                          c.status === 'Returned For Rework' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>{c.status}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-200">{c.title}</h4>
                      <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                        <span>Filer: {getMaskedStudentName(c)}</span>
                        <span>•</span>
                        <span>Teacher: {c.assignedTeacherName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedComplaintId(c.id)}
                        className="py-2 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-350 text-xs font-bold transition-all cursor-pointer"
                      >
                        Inspect Plans
                      </button>
                      {c.status !== 'Returned For Rework' && (
                        <>
                          <button
                            onClick={() => handleApproveResolution(c.id)}
                            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                          >
                            Verify & Close
                          </button>
                          <button
                            onClick={() => setRejectModalId(c.id)}
                            className="py-2 px-4 rounded-xl border border-rose-500/35 hover:border-rose-500/50 bg-rose-500/10 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                          >
                            Return For Rework
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {deptComplaints.filter(c => c.status === 'Pending HOD Verification' || c.status === 'Returned For Rework' || c.isFrozen).length === 0 && (
                  <div className="text-center py-20 border border-dashed border-slate-850 rounded-xl bg-[#030712]/30">
                    <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">No cases pending resolution verification</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SLA MONITORING */}
          {activeTab === 'sla' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-slate-200">SLA Monitoring Center</h3>
                <p className="text-xs text-slate-500 mt-1">Real-time supervision of countdown clocks, escalation risks, and timeline delay indicators.</p>
              </div>

              <div className="space-y-4">
                {deptComplaints
                  .filter(c => c.status !== 'Verified & Closed' && c.status !== 'Closed')
                  .map(c => {
                    const getRemainingSlaText = (comp: any) => {
                      if (comp.status === 'Submitted') return 'Awaiting Teacher Seen status';
                      if (comp.escalationTimerEnds === 'pending') return 'SLA Timer pending initialization';
                      const diffMs = new Date(comp.escalationTimerEnds).getTime() - Date.now();
                      if (diffMs <= 0) return 'SLA BREACHED — ESCALATION TRIGGERED';
                      const totalMinutes = Math.floor(diffMs / (60 * 1000));
                      const hrs = Math.floor(totalMinutes / 60);
                      const mins = totalMinutes % 60;
                      return `${hrs} Hours, ${mins} Minutes remaining`;
                    };

                    const getSlaRiskColor = (comp: any) => {
                      if (comp.status === 'Submitted') return 'text-slate-400 bg-slate-900 border-slate-850';
                      const diffMs = new Date(comp.escalationTimerEnds).getTime() - Date.now();
                      if (diffMs <= 0) return 'text-red-400 bg-red-950/20 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
                      const hoursLeft = diffMs / (60 * 60 * 1000);
                      if (hoursLeft < 2) return 'text-orange-400 bg-orange-950/20 border-orange-500/30 animate-pulse';
                      if (hoursLeft < 12) return 'text-amber-400 bg-amber-950/20 border-amber-500/30';
                      return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30';
                    };

                    const getRiskLabel = (comp: any) => {
                      if (comp.status === 'Submitted') return 'Standby';
                      const diffMs = new Date(comp.escalationTimerEnds).getTime() - Date.now();
                      if (diffMs <= 0) return 'Breached / Escalated';
                      const hoursLeft = diffMs / (60 * 60 * 1000);
                      if (hoursLeft < 2) return 'Critical Risk';
                      if (hoursLeft < 12) return 'Medium Risk';
                      return 'Low Risk';
                    };

                    return (
                      <div key={c.id} className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400">{c.id}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-bold uppercase">{c.priority} priority</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-200">{c.title}</h4>
                          <div className="text-xs text-slate-500 font-semibold">
                            Assigned to: <strong className="text-slate-400">{c.assignedTeacherName}</strong>
                          </div>
                        </div>

                        {/* Countdown Timers */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <div className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-mono ${getSlaRiskColor(c)}`}>
                            {getRemainingSlaText(c)}
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-[#030712] border border-slate-900 text-slate-400 font-mono tracking-widest">
                            {getRiskLabel(c)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {deptComplaints.filter(c => c.status !== 'Verified & Closed' && c.status !== 'Closed').length === 0 && (
                  <div className="text-center py-20 border border-dashed border-slate-850 rounded-xl bg-[#030712]/30">
                    <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">All SLA timers fully resolved</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DEPARTMENT ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Category Donut chart card */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Compass size={18} className="text-indigo-400" />
                    <span>Category Distribution</span>
                  </h3>
                  <div className="py-4 flex justify-center">
                    <CategoryDonutChart data={[
                      { label: 'Marks Discrepancy', value: deptComplaints.filter(c => c.title.toLowerCase().includes('marks') || c.description.toLowerCase().includes('marks')).length, color: '#10b981' },
                      { label: 'ERP Portal Login', value: deptComplaints.filter(c => c.title.toLowerCase().includes('erp') || c.description.toLowerCase().includes('erp') || c.title.toLowerCase().includes('login')).length, color: '#3b82f6' },
                      { label: 'Other Academics', value: deptComplaints.filter(c => !c.title.toLowerCase().includes('marks') && !c.title.toLowerCase().includes('erp') && !c.title.toLowerCase().includes('login')).length, color: '#a855f7' }
                    ]} />
                  </div>
                </div>

                {/* Performance score chart */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-400" />
                    <span>Department Load Diagnostics</span>
                  </h3>
                  <div className="space-y-5 pt-3">
                    {[
                      { name: 'Average Resolution Timer', value: '14.5 Hours', rating: 'Optimal', col: 'text-indigo-400' },
                      { name: 'SLA Breached Ratio', value: `${((slaViolationsCount/totalCount)*100 || 0).toFixed(1)}%`, rating: 'Excellent', col: 'text-purple-400' },
                      { name: 'Satisfaction Star Rating', value: '4.7 ★ Rating', rating: 'Top Tier', col: 'text-emerald-400' }
                    ].map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3.5 bg-[#030712]/50 border border-slate-850 rounded-xl">
                        <span className="text-sm font-bold text-slate-300">{m.name}</span>
                        <div className="text-right">
                          <span className={`block text-lg font-black ${m.col} font-mono`}>{m.value}</span>
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">{m.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Support Concern Trends & Most Supported issues */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                
                {/* 1. Trending Department Issues */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <span className="text-glow-amber text-amber-400 font-sans">⚡</span> Student Concern Trends
                  </h3>
                  <div className="space-y-4 pt-2">
                    {deptComplaints
                      .filter(c => !c.anonymous && !c.protectedIdentity)
                      .sort((a, b) => b.supportCount - a.supportCount)
                      .slice(0, 3)
                      .map((c, index) => (
                        <div key={c.id} className="p-4 bg-[#030712]/50 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">#{index+1} • {c.id}</span>
                            <h4 className="text-sm font-extrabold text-slate-200 line-clamp-1">{c.title}</h4>
                            <span className="text-[10px] text-slate-500 uppercase font-mono block mt-0.5">{c.category}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2.5 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-xs font-black font-mono">
                              {c.supportCount} Votes
                            </span>
                          </div>
                        </div>
                      ))}
                    {deptComplaints.filter(c => !c.anonymous && !c.protectedIdentity).length === 0 && (
                      <p className="text-xs text-slate-500 italic py-4 text-center font-bold uppercase">No supported concerns registered.</p>
                    )}
                  </div>
                </div>

                {/* 2. Most Supported Department Issues analytics */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Activity size={18} className="text-[#10b981]" />
                    <span>Most Supported Academic Concerns</span>
                  </h3>
                  <div className="space-y-4 pt-2">
                    {[
                      { label: 'Marks Discrepancy', count: deptComplaints.filter(c => c.title.toLowerCase().includes('marks') || c.description.toLowerCase().includes('marks')).reduce((acc, curr) => acc + curr.supportCount, 0), color: 'from-emerald-500 to-teal-500' },
                      { label: 'ERP Portal Login', count: deptComplaints.filter(c => c.title.toLowerCase().includes('erp') || c.description.toLowerCase().includes('erp') || c.title.toLowerCase().includes('login')).reduce((acc, curr) => acc + curr.supportCount, 0), color: 'from-blue-500 to-indigo-500' },
                      { label: 'Other Academics', count: deptComplaints.filter(c => !c.title.toLowerCase().includes('marks') && !c.title.toLowerCase().includes('erp') && !c.title.toLowerCase().includes('login')).reduce((acc, curr) => acc + curr.supportCount, 0), color: 'from-purple-500 to-pink-500' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-350 font-bold">
                          <span>{item.label}</span>
                          <span className="font-mono text-slate-400">{item.count} Votes</span>
                        </div>
                        <div className="w-full h-2 bg-[#030712] rounded-full overflow-hidden border border-slate-900">
                          <div className={`h-full bg-gradient-to-r ${item.color}`} style={{ width: `${(item.count / (deptComplaints.reduce((a, b) => a + b.supportCount, 0) || 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: INTERNAL NOTES */}
          {activeTab === 'notes' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-slate-200">Internal Review Notes</h3>
                <p className="text-xs text-slate-500 mt-1">Appended private supervisor remarks on academic cases. Notes are strictly confidential and visible only to HODs and Admins.</p>
              </div>

              <div className="space-y-4">
                {deptComplaints.map(c => (
                  <div key={c.id} className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">{c.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-bold uppercase">{c.status}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">{c.title}</h4>
                      <div className="p-3 bg-[#030712]/40 rounded-lg border border-slate-900 mt-2">
                        <span className="text-[10px] text-emerald-400 block uppercase font-mono font-bold">Confidential Supervisor Notes:</span>
                        <p className="text-xs text-slate-400 mt-1 italic">
                          {c.hodNotes || 'No private supervisor remarks logged yet.'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTempNotes(c.hodNotes || '');
                        setNotesModalId(c.id);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 hover:bg-emerald-950/40 text-emerald-400 text-xs font-bold transition-all cursor-pointer shrink-0 mt-1"
                    >
                      Edit Notes
                    </button>
                  </div>
                ))}
                {deptComplaints.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-slate-850 rounded-xl bg-[#030712]/30">
                    <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">No department complaints found</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ACTIVITY LOGS TIMELINE */}
          {activeTab === 'logs' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-200">Institutional Audit Timelines</h3>
                <p className="text-xs text-slate-500 mt-1">Unalterable records of warnings, freezes, progress inquiries, and priority elevations.</p>
              </div>

              <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2 relative">
                {hodActivityLogs.map((log) => (
                  <div key={log.id} className="relative pl-8 border-l border-slate-850 last:border-transparent pb-6">
                    <span className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-950/60 border border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                    
                    <div className="bg-[#030712]/50 border border-slate-850 p-4 rounded-xl space-y-2 hover:border-slate-800 transition-colors">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-mono">
                        <span className="uppercase text-indigo-400 font-bold">{log.action}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed font-medium">{log.details}</p>
                      <div className="text-[10px] text-slate-500 font-mono font-bold border-t border-slate-900/60 pt-2 flex justify-between">
                        <span>Complaint Reference: {log.complaintId}</span>
                        <span>Supervised by: {log.userName}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {hodActivityLogs.length === 0 && (
                  <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-wider">
                    Timeline logs are currently empty.
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Modal: Complaint Detailed Supervision Inspector */}
      <Modal
        isOpen={selectedComplaint !== undefined}
        onClose={() => setSelectedComplaintId(null)}
        title={selectedComplaint ? `Case Inspection: ${selectedComplaint.id}` : ''}
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6 animate-scaleUp">
            
            {/* Identity Warning Flag (Strictly Masked) */}
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="shrink-0 text-indigo-400 animate-pulse mt-0.5" size={16} />
              <div>
                <strong>Supervisory Data Mask Protection Active:</strong>
                <p className="mt-0.5 text-slate-300 font-normal">
                  In compliance with student safety guidelines, contact emails and roll numbers are completely hidden from this terminal. Oversight mode is restricted to read-only observation.
                </p>
              </div>
            </div>

            {/* Factual parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs font-mono leading-relaxed text-slate-400">
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Category</span>
                <span className="text-slate-200 font-semibold">{selectedComplaint.category}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Status</span>
                <span className="text-indigo-400 font-semibold">{selectedComplaint.status}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Assigned Target</span>
                <span className="text-slate-200 font-semibold">{selectedComplaint.assignedTeacherName}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Upvotes Log</span>
                <span className="text-slate-200 font-semibold">{selectedComplaint.supportCount} students</span>
              </div>
            </div>

            <div className="mb-4 text-sm font-bold text-slate-400 font-mono uppercase tracking-wider bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center gap-2">
              <span>Filer Identity:</span>
              {getMaskedStudentName(selectedComplaint)}
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Grievance Subject Matter</span>
              <h4 className="text-xl font-bold text-slate-200">{selectedComplaint.title}</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-[#030712]/30 border border-slate-900 p-4 rounded-xl whitespace-pre-line">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Display HOD Internal Notes */}
            <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="block text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Private HOD Notes (HOD & Admin Only)</span>
                <button
                  onClick={() => {
                    setTempNotes(selectedComplaint.hodNotes || '');
                    setNotesModalId(selectedComplaint.id);
                  }}
                  className="py-1 px-2.5 rounded bg-indigo-950/20 border border-indigo-800/40 text-indigo-400 text-[10px] font-bold"
                >
                  Edit Notes
                </button>
              </div>
              <p className="text-xs text-slate-400 italic">
                {selectedComplaint.hodNotes || 'No private supervisor remarks documented on this file yet.'}
              </p>
            </div>

            {/* Warnings list on this complaint */}
            {selectedComplaint.warnings && selectedComplaint.warnings.length > 0 && (
              <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-red-400 uppercase tracking-widest font-mono">Faculty Warnings Dispatched</span>
                <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                  {selectedComplaint.warnings.map((w, index) => (
                    <div key={w.id || index} className="p-3 bg-[#030712]/60 rounded-lg border border-slate-900 text-xs">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Notice #{index + 1} | {w.remark}</span>
                        <span>{new Date(w.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-350 mt-1 font-medium">{w.reason}</p>
                      {w.extension && w.extension !== 'No Extension' && (
                        <span className="text-[10px] text-amber-400 font-mono mt-1 block">SLA Extended: {w.extension}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clarification requests */}
            {selectedComplaint.clarificationRequests && selectedComplaint.clarificationRequests.length > 0 && (
              <div className="p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Progress Clarifications Log</span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {selectedComplaint.clarificationRequests.map((q, index) => (
                    <div key={q.id || index} className="p-3 bg-[#030712]/50 rounded-lg border border-slate-900 text-xs">
                      <span className="text-[10px] text-slate-500 font-mono block">Query #{index + 1} | {new Date(q.timestamp).toLocaleDateString()}</span>
                      <p className="text-slate-300 font-semibold mt-1">"{q.query}"</p>
                      <p className="text-[11px] text-slate-500 italic mt-1.5 border-t border-slate-900/60 pt-1">
                        Reply: {q.reply || 'Pending faculty feedback reply...'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HOD Action Authority Row */}
            {selectedComplaint.status !== 'Resolved' && selectedComplaint.status !== 'Closed' && (
              <div className="p-4 bg-slate-950 border border-indigo-900/40 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Supervisor Authorization Overrides</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setWarningModalId(selectedComplaint.id)}
                    className="py-2 px-3 rounded-lg bg-red-950/20 border border-red-800/40 text-red-400 text-xs font-bold transition-all hover:scale-105 active:scale-95 transform cursor-pointer"
                  >
                    Issue Warning Notice
                  </button>
                  <button
                    onClick={() => setClarifyModalId(selectedComplaint.id)}
                    className="py-2 px-3 rounded-lg bg-indigo-950/20 border border-indigo-800/40 text-indigo-400 text-xs font-bold transition-all hover:scale-105 active:scale-95 transform cursor-pointer"
                  >
                    Request Progress Clarification
                  </button>
                  <button
                    onClick={() => handleToggleFreeze(selectedComplaint.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 transform cursor-pointer ${
                      selectedComplaint.isFrozen
                        ? 'bg-emerald-950/20 border border-emerald-800/40 text-emerald-400'
                        : 'bg-purple-950/20 border border-purple-800/40 text-purple-400'
                    }`}
                  >
                    {selectedComplaint.isFrozen ? 'Unfreeze Closure' : 'Freeze Closure'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPriority(selectedComplaint.priority || 'Medium');
                      setPriorityModalId(selectedComplaint.id);
                    }}
                    className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold transition-all hover:scale-105 active:scale-95 transform cursor-pointer"
                  >
                    Adjust Priority
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-slate-900 pt-4">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Diagnostic Status Roadmap</span>
              <ComplaintTimeline status={selectedComplaint.status} />
            </div>

            <div className="border-t border-slate-900 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedComplaintId(null)}
                className="py-2.5 px-6 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-sm font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 transform"
              >
                Close Oversight
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* Modal: Issue warning to teacher */}
      <Modal
        isOpen={warningModalId !== null}
        onClose={() => setWarningModalId(null)}
        title="Issue Warning Notice to Faculty"
      >
        <form onSubmit={handleWarningSubmit} className="space-y-4 animate-scaleUp text-slate-300">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Performance Remark</label>
            <select
              value={warningRemark}
              onChange={(e) => setWarningRemark(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none cursor-pointer"
            >
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="Unsatisfactory">Unsatisfactory</option>
              <option value="Negligent Delay">Negligent Delay</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Warning Reason Notice</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Failure to respond to Wifi connectivity SLA window..."
              value={warningReason}
              onChange={(e) => setWarningReason(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-red-500/30 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Resolution Deadline Extension</label>
            <select
              value={warningExtension}
              onChange={(e) => setWarningExtension(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none cursor-pointer"
            >
              <option value="No Extension">No Extension</option>
              <option value="+12 Hours">+12 Hours</option>
              <option value="+24 Hours">+24 Hours</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setWarningModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-red-650 hover:bg-red-550 text-white text-xs font-bold"
            >
              Issue Formal Warning
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Request progress clarification */}
      <Modal
        isOpen={clarifyModalId !== null}
        onClose={() => setClarifyModalId(null)}
        title="Request Progress Clarification from Teacher"
      >
        <form onSubmit={handleClarifySubmit} className="space-y-4 animate-scaleUp text-slate-300">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Clarification Query</label>
            <textarea
              required
              rows={3}
              placeholder="Write the status clarification query you wish to dispatch to the teacher..."
              value={clarifyQuery}
              onChange={(e) => setClarifyQuery(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-indigo-500/30 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setClarifyModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold"
            >
              Dispatch Inquiry
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Priority */}
      <Modal
        isOpen={priorityModalId !== null}
        onClose={() => setPriorityModalId(null)}
        title="Adjust Complaint Priority Status"
      >
        <form onSubmit={handlePrioritySubmit} className="space-y-4 animate-scaleUp text-slate-300">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Select Supervisor Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="w-full bg-[#030712] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none cursor-pointer"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Critical">Critical Priority</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setPriorityModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold"
            >
              Adjust Priority
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit HOD Notes */}
      <Modal
        isOpen={notesModalId !== null}
        onClose={() => setNotesModalId(null)}
        title="Edit Private HOD Supervisor Notes"
      >
        <form onSubmit={handleNotesSubmit} className="space-y-4 animate-scaleUp text-slate-300">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Private Notes (HOD & Admin Visibility Only)</label>
            <textarea
              rows={4}
              placeholder="e.g. Instructors contacted on this matter. Waiting for Marks resolution verification..."
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-indigo-500/30 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setNotesModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold"
            >
              Commit Private Notes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reject Resolution */}
      <Modal
        isOpen={rejectModalId !== null}
        onClose={() => setRejectModalId(null)}
        title="Reject Faculty Resolution Audit"
      >
        <form onSubmit={handleRejectResolutionSubmit} className="space-y-4 animate-scaleUp text-slate-350">
          <div className="p-3 bg-red-950/15 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold leading-relaxed flex gap-2">
            <AlertOctagon className="shrink-0 mt-0.5" size={16} />
            <span>Auditing Command: You are rejecting the faculty resolution. The complaint will be returned to the teacher with your feedback for re-correction.</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Rejection Reason & Action items</label>
            <textarea
              required
              rows={3}
              placeholder="Explain why the resolution is insufficient (e.g. ERP marks not matching proof, or campus repair incomplete)..."
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-red-500/30 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setRejectModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-red-650 hover:bg-red-550 text-white text-xs font-bold"
            >
              Bounce Back to Teacher
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
