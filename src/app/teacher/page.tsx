'use client';

import React, { useState } from 'react';
import { usePortal } from '@/context/PortalContext';
import { GlowCard } from '@/components/GlowCard';
import { ComplaintTimeline } from '@/components/ComplaintTimeline';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Modal } from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, 
  Search, 
  ThumbsUp, 
  Eye, 
  Play, 
  CheckCircle, 
  UserX, 
  EyeOff, 
  CheckSquare, 
  Clock,
  ShieldCheck,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface SubDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TeacherDashboard({ activeTab, setActiveTab }: SubDashboardProps) {
  const { currentUser, complaints, updateComplaintStatus, resolveComplaint } = usePortal();

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Interactive statistic metric tab filter: 'all' (Assigned), 'pending' (Pending), 'escalated' (Escalated), 'resolved' (Resolved)
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'escalated' | 'resolved'>('all');
  
  // Resolve Form states
  const [activeResolveId, setActiveResolveId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  if (!currentUser) return null;

  // SECURITY RULE: Teachers ONLY see complaints assigned to them
  const teacherComplaints = complaints.filter(c => c.assignedTeacherId === currentUser.id);

  // Compute departmental stats
  const totalAssigned = teacherComplaints.length;
  const pendingCount = teacherComplaints.filter(c => c.status === 'Submitted' || c.status === 'Seen' || c.status === 'In Progress' || c.status === 'Returned For Rework' || c.status === 'Pending HOD Verification').length;
  const escalatedCount = teacherComplaints.filter(c => c.status === 'Escalated').length;
  const resolvedCount = teacherComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Verified & Closed').length;

  const getPriorityBadge = (c: any) => {
    if (c.priority === 'Critical') return { label: 'Critical', color: 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse' };
    if (c.priority === 'High') return { label: 'High', color: 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]' };
    if (c.priority === 'Medium') return { label: 'Medium', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    return { label: 'Low', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
  };

  const selectedComplaint = complaints.find(c => c.id === selectedComplaintId);

  // Submit Resolution action
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolveId || !resolutionDetails) return;
    
    resolveComplaint(activeResolveId, resolutionDetails, resolutionRemarks);
    
    // Reset Form
    setResolutionDetails('');
    setResolutionRemarks('');
    setActiveResolveId(null);
  };

  // Select metric tab action
  const handleTabClick = (tab: 'all' | 'pending' | 'escalated' | 'resolved') => {
    setFilterTab(tab);
    setFilterStatus('all'); // Reset status dropdown so it doesn't conflict with statistics tab overrides
  };

  // Filter complaints list
  const filteredComplaints = teacherComplaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = false;
    if (filterTab === 'all') {
      matchesTab = true;
    } else if (filterTab === 'pending') {
      matchesTab = c.status === 'Submitted' || c.status === 'Seen' || c.status === 'In Progress' || c.status === 'Returned For Rework' || c.status === 'Pending HOD Verification';
    } else if (filterTab === 'escalated') {
      matchesTab = c.status === 'Escalated';
    } else if (filterTab === 'resolved') {
      matchesTab = c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Verified & Closed';
    }
    
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesTab && matchesStatus;
  }).sort((a, b) => {
    const priorityWeight: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
  });

  return (
    <div className="space-y-8 animate-fadeIn select-none">

      {/* Brand Heading Row */}
      <div className="border-b border-[#121c38] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight font-sans text-glow-blue">
            Teacher Dashboard
          </h2>
          <p className="text-lg text-slate-400 mt-2">
            Welcome back, instructor. Supervise, audit, and resolve departmental complaints.
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#030712]/60 border border-white/[0.08] focus:border-blue-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none cursor-pointer font-semibold"
          >
            <option value="all">All States</option>
            <option value="Submitted">Submitted</option>
            <option value="Seen">Seen</option>
            <option value="In Progress">In Progress</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Pending HOD Verification">Pending HOD Verification</option>
            <option value="Returned For Rework">Returned For Rework</option>
            <option value="Verified & Closed">Verified & Closed</option>
          </select>
        </div>
      </div>

      {/* Clickable Teacher Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { id: 'all', label: 'Assigned Complaints', count: totalAssigned, theme: 'blue' },
          { id: 'pending', label: 'Pending Resolution', count: pendingCount, theme: 'amber' },
          { id: 'escalated', label: 'Escalated Breaches', count: escalatedCount, theme: 'rose' },
          { id: 'resolved', label: 'Resolved Cases', count: resolvedCount, theme: 'emerald' }
        ].map((tab) => {
          const isActive = filterTab === tab.id;
          
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
            } else if (tab.theme === 'rose') {
              colorBorder = 'border-rose-500/80 shadow-[0_0_22px_rgba(239,68,68,0.25)]';
              textColor = 'text-rose-400';
              glowClass = 'text-glow-red';
              activeStyles = 'bg-rose-500/[0.03] animate-pulse';
            } else if (tab.theme === 'amber') {
              colorBorder = 'border-amber-500/80 shadow-[0_0_22px_rgba(245,158,11,0.25)]';
              textColor = 'text-amber-400';
              glowClass = 'text-glow-cyan';
              activeStyles = 'bg-amber-500/[0.03]';
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
              onClick={() => handleTabClick(tab.id as any)}
              className={`
                relative text-left rounded-2xl bg-[#090f23]/60 border p-6 flex flex-col justify-between h-36 shadow-lg transition-all duration-300 select-none cursor-pointer transform hover:scale-[1.04] active:scale-95 overflow-hidden group
                ${colorBorder} ${activeStyles}
              `}
            >
              {/* Highlight bar glide */}
              {isActive && (
                <motion.div 
                  layoutId="teacherActiveGlow" 
                  className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-white/0 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              
              <span className="text-sm text-slate-400 font-bold uppercase tracking-wider block group-hover:text-slate-200 transition-colors">
                {tab.label}
              </span>
              <span className={`text-5xl font-black font-sans block mt-auto transition-all ${textColor} ${glowClass}`}>
                {tab.count}
              </span>

              {/* Bottom gradient border glow bar */}
              {isActive && (
                <motion.div 
                  layoutId="teacherActiveLine"
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    tab.theme === 'emerald' ? 'from-emerald-500 to-teal-400' :
                    tab.theme === 'rose' ? 'from-rose-500 to-red-400' :
                    tab.theme === 'amber' ? 'from-amber-500 to-orange-400' :
                    'from-blue-500 to-indigo-500'
                  }`}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Complaints Area */}
      <div className="rounded-2xl bg-[#090f23]/60 border border-[#1d2d5a] p-8 space-y-8 shadow-xl relative">
        <h3 className="text-2xl font-bold text-slate-200 font-sans tracking-wide border-b border-white/[0.06] pb-4 mb-4">
          Complaints Queue Oversight
        </h3>

        {/* Complaints Grid Lists with Framer Motion transitions */}
        <AnimatePresence mode="wait">
          {filteredComplaints.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="text-center py-24 rounded-xl border border-dashed border-white/[0.08] bg-[#0c1228]/50"
            >
              <Inbox className="mx-auto text-slate-500 mb-4 animate-bounce" size={54} />
              <p className="text-lg font-bold text-slate-400 uppercase tracking-wider">Your queue is empty</p>
              <p className="text-base text-slate-500 mt-2 leading-relaxed">No matching complaints exist inside the {filterTab} catalog.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              className="space-y-6"
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {filteredComplaints.map((c) => {
                const prio = getPriorityBadge(c);
                const canMarkSeen = c.status === 'Submitted';
                const canMarkInProgress = c.status === 'Seen';
                const canResolve = c.status === 'Submitted' || c.status === 'Seen' || c.status === 'In Progress';

                return (
                  <motion.div 
                    key={c.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                    className="p-6 rounded-2xl bg-[#0d1532]/80 border border-[#1a2853] flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-blue-500/40 hover:scale-[1.002] hover:shadow-[0_0_20px_rgba(59,130,246,0.06)] transition-all duration-300 shadow-md"
                  >
                    <div className="space-y-3 min-w-0 flex-1">
                      {/* Header Row badges */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-[#1e2e5a] font-mono uppercase tracking-wide">
                          ID: {c.id}
                        </span>
                        <span className={`flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${prio.color}`}>
                          {c.priority === 'Critical' && <ShieldCheck size={12} />}
                          {prio.label} Priority
                        </span>
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          c.status === 'Resolved' || c.status === 'Closed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35'
                            : c.status === 'Escalated'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35 shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/35 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Complaint Title */}
                      <h4 className="text-2xl font-extrabold text-slate-100 tracking-wide leading-snug">{c.title}</h4>
                      
                      {/* Factual Description / Details under header */}
                      <div className="text-sm text-slate-400 font-bold uppercase tracking-wider font-mono">
                        {c.category} • Filed by Student
                      </div>
                      
                      <p className="text-slate-300 text-base leading-relaxed line-clamp-3">
                        {c.description}
                      </p>
                      
                      {c.attachments && c.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="block text-[11px] font-bold text-blue-400 uppercase tracking-widest font-mono">Uploaded Evidence / Supporting Attachment</span>
                          <div className="flex flex-wrap gap-2.5">
                            {c.attachments.map((img: string, idx: number) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/[0.08] bg-slate-900/60 p-1 w-full max-w-xs shadow-md transition-all hover:border-blue-500/30">
                                <img src={img} alt="Evidence base64" className="rounded-lg object-contain max-h-48 w-full" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {c.status === 'Escalated' && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.08)] mt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping shrink-0" />
                          Escalated to Administration. Action lock enabled.
                        </div>
                      )}
                    </div>

                    {/* Right Button Row */}
                    <div className="flex flex-wrap items-center gap-3.5 shrink-0 self-start lg:self-auto">
                      {canResolve && (
                        <div className="flex flex-wrap items-center gap-3">
                          {canMarkSeen && (
                            <button
                              onClick={() => updateComplaintStatus(c.id, 'Seen')}
                              className="py-2.5 px-4 rounded-xl border border-white/[0.08] hover:border-blue-500/40 bg-white/[0.02] hover:bg-blue-600/10 hover:text-blue-400 text-slate-300 text-sm font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 transform"
                            >
                              Mark Seen
                            </button>
                          )}
                          {canMarkInProgress && (
                            <button
                              onClick={() => updateComplaintStatus(c.id, 'In Progress')}
                              className="py-2.5 px-4 rounded-xl border border-white/[0.08] hover:border-blue-500/40 bg-white/[0.02] hover:bg-blue-600/10 hover:text-blue-400 text-slate-300 text-sm font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 transform"
                            >
                              Start Action
                            </button>
                          )}
                          <button
                            onClick={() => setActiveResolveId(c.id)}
                            className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 transform"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setSelectedComplaintId(c.id)}
                        className="py-2.5 px-5 rounded-xl border border-[#1e2e5a] bg-transparent hover:bg-blue-600/10 hover:border-blue-500/40 text-slate-300 hover:text-slate-100 text-sm font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 transform"
                      >
                        View Timeline Logs
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal: Full Timeline Logs Drawer */}
      <Modal
        isOpen={selectedComplaint !== undefined}
        onClose={() => setSelectedComplaintId(null)}
        title={selectedComplaint ? `Inspection Audit Logs: ${selectedComplaint.id}` : ''}
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6 animate-scaleUp">
            
            {/* Grievance metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 border border-white/[0.08] p-4 rounded-xl text-xs font-mono leading-relaxed text-slate-400">
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Category</span>
                <span className="text-slate-200 font-semibold">{selectedComplaint.category}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Status</span>
                <span className="text-blue-400 font-semibold">{selectedComplaint.status}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Assigned Target</span>
                <span className="text-slate-200 font-semibold">{selectedComplaint.assignedTeacherName}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wide mb-0.5">Upvotes</span>
                <span className="text-slate-200 font-semibold">{selectedComplaint.supportCount} students</span>
              </div>
            </div>

            {/* Student Details with Protection encryption */}
            <div className="mb-5 flex flex-wrap gap-4 text-sm font-bold text-slate-400 font-mono uppercase tracking-wider bg-white/[0.01] p-3 rounded-xl border border-white/[0.06]">
              <div>
                Student: <span className={`font-black ${selectedComplaint.protectedIdentity || selectedComplaint.anonymous ? 'text-purple-400' : 'text-slate-200'}`}>
                  {selectedComplaint.protectedIdentity || selectedComplaint.anonymous ? 'REDACTED (PROTECTED ENCRYPTED)' : selectedComplaint.studentName}
                </span>
              </div>
              {!selectedComplaint.protectedIdentity && !selectedComplaint.anonymous && (
                <div>
                  Email: <span className="text-slate-300 font-medium normal-case">{selectedComplaint.studentEmail}</span>
                </div>
              )}
            </div>

            {/* Core concern details */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Factual Grievance Description</span>
              <h4 className="text-xl font-bold text-slate-200">{selectedComplaint.title}</h4>
              <p className="text-base text-slate-300 leading-relaxed bg-[#030712]/30 border border-white/[0.06] p-4 rounded-xl whitespace-pre-line">
                {selectedComplaint.description}
              </p>
              
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="block text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">Uploaded Evidence / Supporting Attachment</span>
                  <div className="flex flex-wrap gap-3">
                    {selectedComplaint.attachments.map((img: string, idx: number) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/[0.08] bg-slate-900/60 p-1.5 max-w-md shadow-md transition-all hover:border-blue-500/30">
                        <img src={img} alt="Evidence base64" className="rounded-lg object-contain max-h-64 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Connected timeline */}
            <div className="border-t border-white/[0.06] pt-5">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Diagnostic Status Roadmap</span>
              <ComplaintTimeline status={selectedComplaint.status} />
            </div>

            {/* Close modal action button */}
            <div className="border-t border-white/[0.08] pt-4 flex justify-end">
              <button
                onClick={() => setSelectedComplaintId(null)}
                className="py-3 px-6 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white text-sm font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 transform"
              >
                Close Audit Logs
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* Modal: Resolve Complaint mandatory form */}
      <Modal
        isOpen={activeResolveId !== null}
        onClose={() => setActiveResolveId(null)}
        title="Broadcast Resolution Output"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-6 animate-scaleUp">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm leading-relaxed font-semibold">
            <CheckSquare className="shrink-0 mt-0.5 animate-pulse" size={18} />
            <p>
              Entering resolution outputs instantly triggers alert logs for the student to confirm closure. Action details input is strictly mandatory.
            </p>
          </div>

          {/* Resolution Details */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Administrative Action Taken (Mandatory)</label>
            <textarea
              required
              rows={4}
              placeholder="State precise technical or administrative actions implemented to address this grievance..."
              value={resolutionDetails}
              onChange={(e) => setResolutionDetails(e.target.value)}
              className="w-full bg-slate-950 border border-white/[0.08] focus:border-emerald-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none leading-relaxed resize-none cursor-text placeholder-slate-600"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Remarks</label>
            <textarea
              rows={3}
              placeholder="Provide context remarks or instructions for the student to verify..."
              value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-white/[0.08] focus:border-emerald-500/40 rounded-xl py-3 px-4 text-base text-slate-200 outline-none leading-relaxed resize-none cursor-text placeholder-slate-600"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={() => setActiveResolveId(null)}
              className="py-3 px-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 text-sm font-semibold cursor-pointer hover:scale-105 active:scale-95 transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold cursor-pointer hover:scale-105 active:scale-95 transform shadow-md"
            >
              Submit Resolution
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
