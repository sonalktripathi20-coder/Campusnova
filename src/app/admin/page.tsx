'use client';

import React, { useState } from 'react';
import { usePortal } from '@/context/PortalContext';
import { GlowCard } from '@/components/GlowCard';
import { ComplaintTimeline } from '@/components/ComplaintTimeline';
import { CategoryDonutChart, VerticalCategoryBarChart } from '@/components/AnalyticsCharts';
import { Modal } from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ShieldAlert, 
  Users, 
  AlertOctagon, 
  FileSpreadsheet, 
  BarChart2, 
  Megaphone, 
  ShieldCheck, 
  Activity, 
  FolderLock, 
  Eye, 
  Trash2, 
  UserPlus, 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckSquare, 
  Plus, 
  X, 
  AlertCircle,
  FileText,
  Bookmark,
  Zap,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

interface SubDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminDashboard({ activeTab, setActiveTab }: SubDashboardProps) {
  const { 
    complaints, 
    activityLogs, 
    updateComplaintFields, 
    updateComplaintPriority,
    deleteComplaint,
    addActivityLog 
  } = usePortal();

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, boolean>>({});

  // Investigation Mode states
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [investigationChecklist, setInvestigationChecklist] = useState<string[]>([
    'Student Roll Number Verified',
    'Faculty Log Timeline Audited',
    'Contact Tracing Completed'
  ]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Administrative action modal states
  const [emergencyModalId, setEmergencyModalId] = useState<string | null>(null);
  const [rapidResponseTeam, setRapidResponseTeam] = useState(true);
  const [emergencyAuthorityAlert, setEmergencyAuthorityAlert] = useState(true);

  const [strictActionModalId, setStrictActionModalId] = useState<string | null>(null);
  const [strictActionType, setStrictActionType] = useState('Mark Negligence');
  const [disciplinaryDetails, setDisciplinaryDetails] = useState('');

  const [reopenModalId, setReopenModalId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  const [overrideModalId, setOverrideModalId] = useState<string | null>(null);
  const [overrideResolution, setOverrideResolution] = useState('');

  const [priorityModalId, setPriorityModalId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Critical');

  const [rerouteModalId, setRerouteModalId] = useState<string | null>(null);
  const [rerouteCategory, setRerouteCategory] = useState<'Maintenance' | 'Lecturer / ERP / Marks' | 'Harassment'>('Maintenance');

  // User Management State (Institutional Roster)
  const [rosterUsers, setRosterUsers] = useState<Array<{ id: string; name: string; email: string; role: string; dept: string; status: 'Active' | 'Locked' | 'Suspended' }>>([
    { id: 'usr-s1', name: 'Sonal Tripathi', email: 'sonal@student.edu', role: 'Student', dept: 'Computer Science', status: 'Active' },
    { id: 'usr-s2', name: 'Kumkum Mandrawa', email: 'kumkum@student.edu', role: 'Student', dept: 'Information Technology', status: 'Active' },
    { id: 'usr-s3', name: 'Roshan Kumar', email: 'roshan@student.edu', role: 'Student', dept: 'Electrical Engineering', status: 'Active' },
    { id: 'usr-t1', name: 'Prof. Kashif Sheikh', email: 'academics@teacher.edu', role: 'Teacher', dept: 'Academics / Marks', status: 'Active' },
    { id: 'usr-t2', name: 'Maintenance Team', email: 'maintenance@teacher.edu', role: 'Teacher', dept: 'Infrastructure', status: 'Active' },
    { id: 'usr-t3', name: 'Grievance Team', email: 'grievance@teacher.edu', role: 'Teacher', dept: 'Harassment Compliance', status: 'Active' },
    { id: 'usr-h1', name: 'Dr. Anand (HOD)', email: 'hod@college.edu', role: 'HOD', dept: 'Computer Science & Engineering', status: 'Active' }
  ]);

  // Form states to Add Profile
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Teacher');
  const [newUserDept, setNewUserDept] = useState('Computer Science');

  // System Broadcast announcements list state
  const [broadcasts, setBroadcasts] = useState<Array<{ id: string; title: string; message: string; category: string; timestamp: string }>>([
    { id: 'b-1', title: 'ERP Server Maintenance Window', message: 'ERP portal will undergo maintenance this Sunday from 02:00 AM to 06:00 AM.', category: 'Maintenance', timestamp: new Date().toISOString() },
    { id: 'b-2', title: 'Institutional Safety Compliance Guidelines', message: 'All students are requested to report marks discrepancies and safety queries immediately through their dashboard portals.', category: 'Safety Alert', timestamp: new Date(Date.now() - 24*3600*1000).toISOString() }
  ]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState('General Notification');

  // Security Audit States
  const [securityAlerts, setSecurityAlerts] = useState<Array<{ id: string; msg: string; type: 'Critical' | 'Warning' | 'Info'; time: string }>>([
    { id: 'sec-1', msg: 'Multiple failed HOD login attempts from outside campus network', type: 'Warning', time: new Date(Date.now() - 3600 * 1000).toISOString() },
    { id: 'sec-2', msg: 'Admin security database sync checksum verification passed', type: 'Info', time: new Date(Date.now() - 7200 * 1000).toISOString() }
  ]);

  // General Filter Calculations
  const filteredControlComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'emergency') {
      matchesStatus = c.isEmergency === true;
    } else if (statusFilter === 'escalated') {
      matchesStatus = c.status === 'Escalated' || c.escalatedToAdmin === true;
    } else if (statusFilter !== 'all') {
      matchesStatus = c.status === statusFilter;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    // Sticky top sorting for Admin Command
    const getEscalationWeight = (c: any) => {
      if (c.escalatedToAdmin || c.status === 'Escalated') return 3;
      if (c.isEmergency) return 2;
      if (c.priority === 'Critical') return 1;
      return 0;
    };
    return getEscalationWeight(b) - getEscalationWeight(a);
  });

  const selectedComplaint = complaints.find(c => c.id === selectedComplaintId);
  const investigatedComplaint = complaints.find(c => c.id === investigationId);

  // ADMIN SECURITY OVERRIDE: Assign Emergency Response Team
  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyModalId) return;

    updateComplaintPriority(emergencyModalId, 'Critical');
    updateComplaintFields(emergencyModalId, {
      isEmergency: true,
      rapidResponseAssigned: rapidResponseTeam
    });

    addActivityLog(
      emergencyModalId,
      'Emergency Mode Activated',
      `Admin elevated complaint to EMERGENCY. Rapid Response: ${rapidResponseTeam ? 'YES' : 'NO'}. Authorities Notified: ${emergencyAuthorityAlert ? 'YES' : 'NO'}`
    );

    setEmergencyModalId(null);
    alert('Operational Command Executed: Emergency status engaged. Rapid response team has been assigned.');
  };

  // ADMIN ACTION: Override Priority
  const handlePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityModalId) return;

    updateComplaintPriority(priorityModalId, selectedPriority);
    setPriorityModalId(null);
    alert(`Priority overriden to ${selectedPriority} by Admin command.`);
  };

  // ADMIN ACTION: Strict Action Center Execution
  const handleStrictActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strictActionModalId || !disciplinaryDetails) return;

    const target = complaints.find(c => c.id === strictActionModalId);
    if (!target) return;

    const actionLogDetails = `Admin issued Strict Disciplinary Action (${strictActionType}) on assigned teacher ${target.assignedTeacherName}. Details: ${disciplinaryDetails}`;
    
    // Update complaint model with custom disciplinary logs
    const actionObj = {
      id: `disc-${Date.now()}`,
      actionType: strictActionType,
      negligence: strictActionType === 'Mark Negligence',
      timestamp: new Date().toISOString()
    };

    updateComplaintFields(strictActionModalId, {
      disciplinaryActions: [...(target.disciplinaryActions || []), actionObj]
    });

    addActivityLog(strictActionModalId, 'Strict Action Dispatched', actionLogDetails);

    // If teacher suspension action is taken, mock suspend teacher access in roster
    if (strictActionType === 'Suspend Teacher Access') {
      setRosterUsers(prev => prev.map(u => u.id === target.assignedTeacherId ? { ...u, status: 'Suspended' } : u));
    }

    setStrictActionModalId(null);
    setDisciplinaryDetails('');
    alert(`Administrative Action Dispatched: ${strictActionType} successfully locked.`);
  };

  // ADMIN ACTION: Force Reopen any resolved/closed case
  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenModalId || !reopenReason) return;

    updateComplaintFields(reopenModalId, {
      status: 'In Progress',
      reopenedCount: (complaints.find(c => c.id === reopenModalId)?.reopenedCount || 0) + 1
    });

    addActivityLog(
      reopenModalId,
      'Reopened by Admin',
      `Admin forced case reopening. Reason: ${reopenReason}`
    );

    setReopenModalId(null);
    setReopenReason('');
    alert('Operational Command Executed: Complaint reopened and returned to active resolution pools.');
  };

  // ADMIN ACTION: Override Resolution Details
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalId || !overrideResolution) return;

    const target = complaints.find(c => c.id === overrideModalId);
    if (!target) return;

    updateComplaintFields(overrideModalId, {
      resolutionDetails: overrideResolution,
      resolutionRemarks: 'Overridden by Admin Command'
    });

    addActivityLog(
      overrideModalId,
      'Resolution Overridden',
      `Admin overrode resolution details: "${overrideResolution}"`
    );

    setOverrideModalId(null);
    setOverrideResolution('');
    alert('Resolution overridden in standard logs.');
  };

  // ADMIN COMMAND: Re-Route Department
  const handleRerouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rerouteModalId) return;

    const getRerouteAssignment = (cat: string) => {
      if (cat === 'Maintenance') return { id: 'usr-t2', name: 'Maintenance Team' };
      if (cat === 'Lecturer / ERP / Marks') return { id: 'usr-t1', name: 'Prof. Kashif Sheikh' };
      return { id: 'usr-t3', name: 'Grievance Team' };
    };

    const assignment = getRerouteAssignment(rerouteCategory);

    updateComplaintFields(rerouteModalId, {
      category: rerouteCategory,
      assignedTeacherId: assignment.id,
      assignedTeacherName: assignment.name,
      status: 'Submitted',
      escalationTimerEnds: 'pending'
    });

    addActivityLog(
      rerouteModalId,
      'Department Re-Routed',
      `Admin re-routed complaint to "${rerouteCategory}" assigned to ${assignment.name}`
    );

    setRerouteModalId(null);
    alert(`Department successfully re-routed to: ${rerouteCategory}. Grievance has been assigned to ${assignment.name}.`);
  };

  // USER MANAGEMENT: Add profile to roster
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newProfile = {
      id: `usr-${Math.random().toString(36).substr(2, 5)}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      dept: newUserDept,
      status: 'Active' as const
    };

    setRosterUsers(prev => [newProfile, ...prev]);
    
    // Log User Addition activity
    addActivityLog('System User Management', 'Profile Registered', `Admin added new ${newUserRole} profile: ${newUserName} (${newUserEmail})`);

    setNewUserName('');
    setNewUserEmail('');
    alert('Profile successfully registered on campus directory server.');
  };

  // USER MANAGEMENT: Lock/Unlock profile
  const toggleUserLock = (id: string) => {
    setRosterUsers(prev => prev.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Active' ? 'Locked' as const : 'Active' as const;
        addActivityLog('System User Management', newStatus === 'Locked' ? 'Account Locked' : 'Account Unlocked', `Admin toggled profile security status for ${u.name} to ${newStatus}`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  // USER MANAGEMENT: Remove profile
  const deleteUserProfile = (id: string) => {
    const user = rosterUsers.find(u => u.id === id);
    if (!user) return;

    setRosterUsers(prev => prev.filter(u => u.id !== id));
    addActivityLog('System User Management', 'Profile Deleted', `Admin removed user ${user.name} from directory permanently.`);
    alert('User profile removed.');
  };

  // BROADCAST NOTICES: Add announcement
  const handleAddBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    const newB = {
      id: `b-${Date.now()}`,
      title: broadcastTitle,
      message: broadcastMessage,
      category: broadcastCategory,
      timestamp: new Date().toISOString()
    };

    setBroadcasts(prev => [newB, ...prev]);

    // System Alert Log
    addActivityLog('System Broadcast notices', 'Announcement Broadcasted', `Admin broadcasted alert: "${broadcastTitle}"`);

    setBroadcastTitle('');
    setBroadcastMessage('');
    alert('College-wide announcement broadcasted successfully.');
  };

  // SYSTEM LOGS EXPORTERS
  const simulateExport = (format: 'PDF' | 'CSV') => {
    alert(`Compiling institutional records... \nAudit Signature Key Locked.\nDownload of SystemLogs.${format.toLowerCase()} triggered successfully.`);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100 select-none pb-12">
      
      {/* Cockpit Authority Banner Heading */}
      <div className="border-b border-rose-950 pb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-rose-950/80 border border-rose-500/40 text-rose-400 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse">
              <ShieldAlert size={14} /> Superuser Central Command Engaged
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight font-sans text-glow-red flex items-center gap-3 mt-2">
            <FolderLock className="text-rose-400" size={38} />
            <span>Institutional Control Cockpit</span>
          </h2>
          <p className="text-base text-slate-400 mt-2 font-medium">
            Overrule resolution targets, mark teacher negligence, suspend accounts, broadcast notices, and investigate protected filers. <span className="text-rose-400 font-bold">(Superuser Mode)</span>
          </p>
        </div>
      </div>

      {/* Dynamic Count widgets with active filters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        
        <div 
          onClick={() => { setStatusFilter('all'); setActiveTab('control'); }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'all' && activeTab === 'control'
              ? 'border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.18)] bg-rose-950/10'
              : 'border-slate-800/80 hover:border-rose-500/40'
          }`}
        >
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Database</span>
          <span className="text-3xl font-black font-sans text-rose-400 block mt-2 text-glow-red">{complaints.length}</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Decrypted files tracking</span>
        </div>

        <div 
          onClick={() => { setStatusFilter('emergency'); setActiveTab('control'); }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'emergency' && activeTab === 'control'
              ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.22)] bg-red-950/10'
              : 'border-slate-800/80 hover:border-red-500/40 animate-pulse'
          }`}
        >
          <div className="absolute top-4 right-4 text-red-500">
            <Zap size={14} className="animate-bounce" />
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Emergency Cases</span>
          <span className="text-3xl font-black font-sans text-red-400 block mt-2 text-glow-red">
            {complaints.filter(c => c.isEmergency).length}
          </span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Active rapid response alert</span>
        </div>

        <div 
          onClick={() => { setStatusFilter('escalated'); setActiveTab('control'); }}
          className={`p-5 rounded-2xl bg-[#090f23]/60 border transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg relative ${
            statusFilter === 'escalated' && activeTab === 'control'
              ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.18)] bg-amber-950/10'
              : 'border-slate-800/80 hover:border-amber-500/40'
          }`}
        >
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Escalated Tickets</span>
          <span className="text-3xl font-black font-sans text-amber-500 block mt-2 text-glow-amber">
            {complaints.filter(c => c.status === 'Escalated' || c.escalatedToAdmin).length}
          </span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Forwarded for intervention</span>
        </div>

        <div 
          onClick={() => setActiveTab('users')}
          className="p-5 rounded-2xl bg-[#090f23]/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg"
        >
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Active Accounts</span>
          <span className="text-3xl font-black font-sans text-emerald-400 block mt-2 text-glow-green">{rosterUsers.length}</span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Authorized profiles roster</span>
        </div>

        <div 
          onClick={() => setActiveTab('security')}
          className="p-5 rounded-2xl bg-[#090f23]/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 transform hover:scale-[1.03] cursor-pointer shadow-lg"
        >
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Security Alerts</span>
          <span className="text-3xl font-black font-sans text-indigo-400 block mt-2 text-glow-blue">
            {securityAlerts.filter(a => a.type === 'Critical' || a.type === 'Warning').length}
          </span>
          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">Campus gateway logs checks</span>
        </div>

      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Emergency Banner Alert Panel */}
              {complaints.some(c => c.isEmergency) && (
                <div className="p-5 bg-red-950/20 border border-red-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm leading-relaxed shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                      <Zap size={24} className="animate-bounce" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-red-400 block uppercase tracking-widest">CRITICAL EMERGENCY SITUATION ENGAGED</span>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Critical priority rapid response teams have been dispatched for escalated student grievances.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setStatusFilter('emergency'); setActiveTab('control'); }}
                    className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all"
                  >
                    View Emergency Queue
                  </button>
                </div>
              )}

              {/* Master Telemetry Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Broadcast notice board preview */}
                <div className="xl:col-span-2 rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <Megaphone size={18} className="text-rose-400 text-glow-red" />
                      <span>Live Broadcast announcements notices</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('broadcast')}
                      className="text-xs text-rose-450 hover:text-rose-450/80 font-bold uppercase cursor-pointer"
                    >
                      Post Notice
                    </button>
                  </div>
                  
                  <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                    {broadcasts.map(b => (
                      <div key={b.id} className="p-4 bg-[#030712]/50 border border-slate-850 rounded-xl space-y-1.5 relative hover:border-slate-800 transition-colors">
                        <span className="absolute top-4 right-4 text-[9px] font-mono font-bold text-slate-500">
                          {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold uppercase font-mono tracking-wider">
                          {b.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{b.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{b.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Security status card */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-rose-400" />
                      <span>System Security Alerts</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('security')}
                      className="text-xs text-rose-400 font-bold uppercase font-mono"
                    >
                      Audit Gateway
                    </button>
                  </div>
                  <div className="space-y-3">
                    {securityAlerts.map(a => (
                      <div key={a.id} className="p-3 bg-[#030712]/40 border border-slate-900 rounded-xl text-xs space-y-1 relative">
                        <span className={`w-1.5 h-1.5 rounded-full absolute top-4 right-4 ${
                          a.type === 'Critical' ? 'bg-red-500 animate-ping' : a.type === 'Warning' ? 'bg-amber-500' : 'bg-indigo-400'
                        }`} />
                        <span className="text-[9px] text-slate-500 font-mono font-bold block">{new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <p className="text-slate-300 font-semibold pr-3">{a.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: COMPLAINT CONTROL CENTER */}
          {activeTab === 'control' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Database Control System</h3>
                  <p className="text-xs text-slate-500 mt-1">Superuser authority allows reassigning targets, executing warnings, deleting files, or force reopening any resolved logs.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 outline-none cursor-pointer font-bold focus:border-rose-500/40"
                  >
                    <option value="all">All Categories</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Lecturer / ERP / Marks">Lecturer / ERP</option>
                    <option value="Harassment">Harassment</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 outline-none cursor-pointer font-bold focus:border-rose-500/40"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Seen">Seen</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending HOD Review">Pending HOD Review</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="emergency">Emergency Active</option>
                  </select>
                </div>
              </div>

              {/* Master Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="text"
                  placeholder="Superuser search: Query database files by title, ID, roll number, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-300 outline-none placeholder-slate-600 font-medium"
                />
              </div>

              {/* Grid of complaints with SUPERUSER decrypted identity visibility */}
              <div className="space-y-4">
                {filteredControlComplaints.map(c => (
                  <div 
                    key={c.id}
                    className={`p-5 rounded-xl bg-slate-950/40 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                      (c.status === 'Escalated' || c.escalatedToAdmin) 
                        ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:border-red-400/80' 
                        : 'border-slate-850 shadow-sm hover:border-rose-500/30'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-rose-400 font-mono uppercase">{c.id}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400 font-bold uppercase">{c.category}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                          c.status === 'Resolved' || c.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450 animate-pulse'
                        }`}>{c.status}</span>
                        {c.priority === 'Critical' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse font-black uppercase">
                            <AlertCircle size={10} /> CRITICAL
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
                        {c.isEmergency && (
                          <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                            EMERGENCY
                          </span>
                        )}
                        {(c.status === 'Escalated' || c.escalatedToAdmin) && (
                          <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-red-600/30 text-white border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse flex items-center gap-1">
                            <AlertCircle size={10} /> AUTO ESCALATED
                          </span>
                        )}
                        {c.anonymous && (
                          <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Anonymous Filer
                          </span>
                        )}
                        {c.protectedIdentity && (
                          <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            Protected Identity
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <h4 className="text-base font-bold text-slate-200 truncate">{c.title}</h4>
                        {(c.status === 'Escalated' || c.escalatedToAdmin) && (
                          <div className="text-[10px] text-red-400 font-mono font-bold">
                            SLA Breached: {new Date(c.escalationTimerEnds) <= new Date() ? 'Timer Expired' : 'Impending breach'} • Intervention Required
                          </div>
                        )}
                      </div>
                      
                      {/* Decrypted Identity Box (Superuser privileges strictly revealed) */}
                      <div className="text-[11px] bg-slate-950 border border-slate-900/60 p-2.5 rounded-lg space-y-1 mt-1 text-slate-400 font-mono">
                        <div className="flex flex-wrap items-center gap-x-4">
                          <span>Name: <strong className="text-rose-400 font-bold">{c.studentName}</strong></span>
                          <span>Roll: <strong className="text-slate-200">{c.studentId}</strong></span>
                          <span>Email: <strong className="text-slate-300">{c.studentEmail}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedComplaintId(c.id)}
                        className="py-1.5 px-3 rounded-lg bg-indigo-950/20 border border-indigo-800/40 hover:bg-indigo-950/40 text-indigo-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        Timeline Trace
                      </button>
                      <button
                        onClick={() => setInvestigationId(c.id)}
                        className="py-1.5 px-3 rounded-lg bg-[#030712] border border-slate-800 text-slate-300 text-xs font-bold hover:border-rose-500/40 transition-all cursor-pointer"
                      >
                        Investigate
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete complaint ${c.id} from the database? This action is irreversible.`)) {
                            deleteComplaint(c.id);
                          }
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-red-950/20 border border-red-800/40 hover:bg-red-950/40 text-red-400 transition-all cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLAINT INVESTIGATION MODE */}
          {activeTab === 'investigation' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6">
              
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-slate-200">Database Investigation Terminal</h3>
                <p className="text-xs text-slate-500 mt-1">Audit campus logs, track student profiles, and analyze teacher response speeds.</p>
              </div>              {investigatedComplaint ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-scaleUp">
                  
                  {/* Left column: Investigation detail checklist */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Decryption mode card */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      decryptedKeys[investigatedComplaint.id] 
                        ? 'bg-rose-950/15 border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                        : 'bg-slate-950/50 border-slate-850'
                    }`}>
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                          <FolderLock size={14} className={decryptedKeys[investigatedComplaint.id] ? 'text-rose-400 animate-pulse' : 'text-slate-500'} />
                          <span>Filer Identity Authorization Gate</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">Gate Key: SEC-AES-256</span>
                      </div>

                      {decryptedKeys[investigatedComplaint.id] ? (
                        <div className="pt-4 space-y-3 animate-fadeIn">
                          <div className="p-3 bg-rose-950/20 border border-rose-500/10 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>DECRYPTION SENSITIVE DATA CLEARANCE: System auditor logged name decryption for student security safety tracking. Do not share credentials.</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-[#030712] rounded-xl border border-slate-900">
                              <span className="text-[10px] text-slate-500 block uppercase">Student Name</span>
                              <strong className="text-rose-400 text-sm mt-0.5 block">{investigatedComplaint.studentName}</strong>
                            </div>
                            <div className="p-3 bg-[#030712] rounded-xl border border-slate-900">
                              <span className="text-[10px] text-slate-500 block uppercase">Roll Number ID</span>
                              <strong className="text-slate-100 text-sm mt-0.5 block">{investigatedComplaint.studentId}</strong>
                            </div>
                            <div className="p-3 bg-[#030712] rounded-xl border border-slate-900">
                              <span className="text-[10px] text-slate-500 block uppercase">Institutional Email</span>
                              <strong className="text-slate-200 text-sm mt-0.5 block">{investigatedComplaint.studentEmail}</strong>
                            </div>
                            <div className="p-3 bg-[#030712] rounded-xl border border-slate-900">
                              <span className="text-[10px] text-slate-500 block uppercase">Department / Course</span>
                              <strong className="text-slate-200 text-sm mt-0.5 block">CSE Core (Section A)</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => setDecryptedKeys(prev => ({ ...prev, [investigatedComplaint.id]: false }))}
                            className="py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold transition-all mt-2"
                          >
                            Encrypt Session
                          </button>
                        </div>
                      ) : (
                        <div className="pt-5 space-y-4 text-center py-6 animate-fadeIn">
                          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-450 mx-auto">
                            <Lock size={18} />
                          </div>
                          <div>
                            <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Protected Student Identity Enclave</span>
                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">Name/Email/Roll is masked by default under institutional privacy act.</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setDecryptedKeys(prev => ({ ...prev, [investigatedComplaint.id]: true }));
                              addActivityLog(
                                investigatedComplaint.id,
                                'Identity Decrypted',
                                'Admin authorized decrypted credential access key to audit student identity safety profile.'
                              );
                              alert('Decrypting secure AES-256 database blocks... Access key verified. Student credentials rendered.');
                            }}
                            className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
                          >
                            Decrypt Student Profile
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Core concern details */}
                    <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest font-mono font-bold">Factual Concern Details</span>
                        <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">{investigatedComplaint.category}</span>
                      </div>
                      <h4 className="text-base font-black text-slate-100">{investigatedComplaint.title}</h4>
                      <p className="text-xs text-slate-350 leading-relaxed bg-[#030712]/30 border border-[#121c38] p-3 rounded-lg whitespace-pre-line">
                        {investigatedComplaint.description}
                      </p>
                      {investigatedComplaint.attachments && investigatedComplaint.attachments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-slate-900 pt-3">
                          <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">Uploaded Evidence / Supporting Attachment</span>
                          <div className="flex flex-wrap gap-2.5">
                            {investigatedComplaint.attachments.map((img: string, idx: number) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/[0.08] bg-slate-900/60 p-1 w-full max-w-xs shadow-md transition-all hover:border-rose-500/30">
                                <img src={img} alt="Evidence base64" className="rounded-lg object-contain max-h-48 w-full" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest font-mono">Case Investigation Checklist</span>
                        <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">{investigatedComplaint.id}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {investigationChecklist.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-[#030712] border border-slate-900 rounded-xl text-xs">
                            <span className="text-slate-300 font-semibold">{item}</span>
                            <button
                              onClick={() => setInvestigationChecklist(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300 font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newChecklistItem) return;
                          setInvestigationChecklist(prev => [...prev, newChecklistItem]);
                          setNewChecklistItem('');
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Add investigation task check item..."
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          className="w-full bg-[#030712] border border-slate-900 focus:border-rose-500/20 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none"
                        />
                        <button type="submit" className="py-2 px-4 bg-rose-600 hover:bg-rose-500 rounded-xl text-white text-xs font-bold shrink-0">
                          Add Task
                        </button>
                      </form>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-3">
                      <span className="block text-xs font-bold text-rose-400 uppercase tracking-widest font-mono">Investigation Timeline logs</span>
                      <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                        {activityLogs.filter(log => log.complaintId === investigatedComplaint.id).map(log => (
                          <div key={log.id} className="p-3 bg-[#030712]/50 border border-slate-900 rounded-xl text-xs leading-relaxed">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>Action: {log.action}</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-350 mt-1 font-semibold">"{log.details}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right column: superuser action shortcuts */}
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-850 space-y-4">
                      <span className="block text-xs font-bold text-rose-400 uppercase tracking-widest font-mono border-b border-slate-900 pb-2">Administrative Shortcuts</span>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => setEmergencyModalId(investigatedComplaint.id)}
                          className="w-full py-2.5 px-3 bg-red-650 hover:bg-red-550 rounded-xl text-white text-xs font-bold text-left flex items-center justify-between"
                        >
                          <span>Elevate to Emergency Mode</span>
                          <Zap size={14} />
                        </button>

                        <button
                          onClick={() => setStrictActionModalId(investigatedComplaint.id)}
                          className="w-full py-2.5 px-3 bg-rose-950/30 border border-rose-800/40 hover:bg-rose-950/50 rounded-xl text-rose-400 text-xs font-bold text-left flex items-center justify-between"
                        >
                          <span>Strict action center override</span>
                          <ShieldAlert size={14} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPriority(investigatedComplaint.priority || 'Critical');
                            setPriorityModalId(investigatedComplaint.id);
                          }}
                          className="w-full py-2.5 px-3 bg-orange-950/20 border border-orange-850 hover:bg-orange-950/40 rounded-xl text-orange-400 text-xs font-bold text-left flex items-center justify-between"
                        >
                          <span>Adjust Priority Status</span>
                          <Activity size={14} />
                        </button>

                        <button
                          onClick={() => {
                            setOverrideResolution(investigatedComplaint.resolutionDetails || '');
                            setOverrideModalId(investigatedComplaint.id);
                          }}
                          className="w-full py-2.5 px-3 bg-indigo-950/20 border border-indigo-850 hover:bg-indigo-950/40 rounded-xl text-indigo-400 text-xs font-bold text-left flex items-center justify-between"
                        >
                          <span>Override resolution details</span>
                          <FileText size={14} />
                        </button>

                        <button
                          onClick={() => setReopenModalId(investigatedComplaint.id)}
                          className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-xs font-bold text-left flex items-center justify-between"
                        >
                          <span>Force reopen complaint</span>
                          <RefreshCw size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => setInvestigationId(null)}
                        className="w-full py-2 px-3 border border-slate-850 text-slate-450 hover:border-slate-800 hover:text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Exit Investigation Mode
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-slate-850 bg-[#030712]/30 rounded-2xl space-y-4">
                  <ShieldAlert className="mx-auto text-rose-450" size={54} />
                  <p className="text-base font-bold text-slate-400 uppercase tracking-wider">Select a complaint from Control Center to audit</p>
                  <button
                    onClick={() => setActiveTab('control')}
                    className="py-2.5 px-6 bg-rose-600 hover:bg-rose-500 rounded-xl text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    Open Control Center <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADVANCED ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution chart */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <BarChart2 size={18} className="text-rose-400" />
                    <span>Category Load Volumes</span>
                  </h3>
                  <div className="py-4 flex justify-center">
                    <CategoryDonutChart data={[
                      { label: 'Maintenance', value: complaints.filter(c => c.category === 'Maintenance').length, color: '#f43f5e' },
                      { label: 'Lecturer / ERP', value: complaints.filter(c => c.category === 'Lecturer / ERP / Marks').length, color: '#6366f1' },
                      { label: 'Harassment', value: complaints.filter(c => c.category === 'Harassment').length, color: '#a855f7' }
                    ]} />
                  </div>
                </div>

                {/* Bar chart */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Activity size={18} className="text-rose-400" />
                    <span>Monthly Resolution Performance Trends</span>
                  </h3>
                  <div className="py-4">
                    <VerticalCategoryBarChart data={[
                      { label: 'March', value: 88 },
                      { label: 'April', value: 92 },
                      { label: 'May (Active)', value: 96 }
                    ]} />
                  </div>
                </div>
              </div>

              {/* High Support Queues and Public Issue Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                
                {/* 1. High Support Unresolved Complaints */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <span className="text-glow-red text-red-400 font-sans">🔥</span> High Support Unresolved Grievances
                  </h3>
                  <div className="space-y-4 pt-2">
                    {complaints
                      .filter(c => c.status !== 'Resolved' && c.status !== 'Closed')
                      .sort((a, b) => b.supportCount - a.supportCount)
                      .slice(0, 3)
                      .map(c => (
                        <div key={c.id} className="p-4 bg-[#030712]/50 border border-slate-850 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase">
                            <span>{c.id} • Assigned: {c.assignedTeacherName}</span>
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold font-mono">
                              {c.supportCount} Supports
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-200 truncate">{c.title}</h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold">
                            <span>Category: {c.category}</span>
                            <span className="text-orange-400 font-bold">{c.priority || 'Medium'} Priority</span>
                          </div>
                        </div>
                      ))}
                    {complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length === 0 && (
                      <p className="text-xs text-slate-500 italic py-4 text-center font-bold uppercase">No unresolved public complaints.</p>
                    )}
                  </div>
                </div>

                {/* 2. Public Issue Heatmap */}
                <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Activity size={18} className="text-rose-455" />
                    <span>Public Concern Heatmap</span>
                  </h3>
                  <div className="space-y-3.5 pt-2">
                    {[
                      { area: 'Hostel Corridors & Block B (WiFi Infrastructure)', votes: complaints.filter(c => c.title.toLowerCase().includes('wifi') || c.description.toLowerCase().includes('wifi')).reduce((a, b) => a + b.supportCount, 0), percentage: 65, color: 'bg-rose-500' },
                      { area: 'Central Cafeteria & Campus Safety', votes: complaints.filter(c => c.title.toLowerCase().includes('cafeteria') || c.description.toLowerCase().includes('cafeteria') || c.title.toLowerCase().includes('harassment') || c.description.toLowerCase().includes('harassment')).reduce((a, b) => a + b.supportCount, 0), percentage: 80, color: 'bg-amber-500' },
                      { area: 'Central Library Study Hall B (HVAC Systems)', votes: complaints.filter(c => c.title.toLowerCase().includes('ac') || c.description.toLowerCase().includes('ac') || c.title.toLowerCase().includes('library') || c.description.toLowerCase().includes('library')).reduce((a, b) => a + b.supportCount, 0), percentage: 40, color: 'bg-indigo-500' },
                      { area: 'ERP Marks Discrepancy & Database Server', votes: complaints.filter(c => c.title.toLowerCase().includes('erp') || c.description.toLowerCase().includes('erp')).reduce((a, b) => a + b.supportCount, 0), percentage: 55, color: 'bg-purple-500' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-350 font-bold">
                          <span>{item.area}</span>
                          <span className="font-mono text-slate-400">{item.votes} Votes ({item.percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-[#030712] rounded-full overflow-hidden border border-slate-900">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: USER ROSTER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Left col: Add new user profile */}
              <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-5 h-fit">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <UserPlus size={18} className="text-rose-400" />
                  <span>Register Campus Profile</span>
                </h3>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. Kashif Sheikh"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/30 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Institutional Email</label>
                    <input
                      type="email"
                      required
                      placeholder="academics@teacher.edu"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/30 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Role Option</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="Teacher">Teacher (Faculty)</option>
                      <option value="HOD">HOD (Supervisor)</option>
                      <option value="Student">Student (Filer)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Assigned Department</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={newUserDept}
                      onChange={(e) => setNewUserDept(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/30 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    Commit Profile Addition
                  </button>
                </form>
              </div>

              {/* Right col: Directory Roster List table */}
              <div className="xl:col-span-2 rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Users size={18} className="text-rose-400" />
                  <span>Authorized Campus Directory Roster</span>
                </h3>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {rosterUsers.map(user => (
                    <div key={user.id} className="p-4 bg-[#030712]/50 border border-slate-850 rounded-xl flex items-center justify-between gap-4 hover:border-slate-800 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200 truncate">{user.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            user.role === 'HOD' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : user.role === 'Teacher' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-850 text-slate-400'
                          }`}>{user.role}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'
                          }`}>{user.status}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold truncate font-mono">
                          <span>{user.email}</span>
                          <span className="mx-2">•</span>
                          <span>Dept: {user.dept}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {user.role === 'Teacher' && (
                          <button
                            onClick={() => {
                              addActivityLog(
                                'SYSTEM_WARNING',
                                'Official Negligence Notice',
                                `Admin issued strict warning to ${user.name} regarding institutional compliance delay.`
                              );
                              alert(`Negligence Warning successfully dispatched to ${user.name}. Case logged in Activity Trails.`);
                            }}
                            className="p-2 rounded bg-amber-950/20 border border-amber-800/40 hover:bg-amber-950/40 text-amber-400 transition-colors"
                            title="Issue Negligence Warning Notice"
                          >
                            <AlertCircle size={12} />
                          </button>
                        )}
                        {user.role === 'Student' && (
                          <button
                            onClick={() => {
                              addActivityLog(
                                'STUDENT_SUSPENSION',
                                'Student Access Restricted',
                                `Admin suspended credential access for ${user.name} pending administrative hearing.`
                              );
                              toggleUserLock(user.id);
                              alert(`Credential lock active. student ${user.name} status updated.`);
                            }}
                            className="p-2 rounded bg-purple-950/20 border border-purple-800/40 hover:bg-purple-950/40 text-purple-400 transition-colors"
                            title="Suspend Access Credentials"
                          >
                            <ShieldAlert size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => toggleUserLock(user.id)}
                          className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                          title={user.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                        >
                          {user.status === 'Active' ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                        <button
                          onClick={() => deleteUserProfile(user.id)}
                          className="p-2 rounded bg-red-950/20 border border-red-800/40 hover:bg-red-950/40 text-red-400 transition-all cursor-pointer"
                          title="Remove user profile"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
               {/* TAB 4: CRITICAL ESCALATION WAR ROOM */}
          {activeTab === 'war_room' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-red-500/30 p-8 shadow-[0_0_30px_rgba(239,68,68,0.15)] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-650 via-rose-500 to-red-650 animate-pulse" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 text-glow-red animate-pulse">
                    <ShieldAlert size={22} className="text-red-500 shrink-0" />
                    <span>Critical Escalation War Room</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Sticky real-time indicators for auto-escalated issues, breached SLAs, and high-urgency compliance alerts.</p>
                </div>
                
                <span className="px-3 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider font-mono animate-pulse">
                  CRISIS CONTROL STATION ACTIVE
                </span>
              </div>

              {/* Alarm Banner Box */}
              <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center gap-3">
                <AlertCircle className="text-red-400 shrink-0 animate-bounce" size={20} />
                <div className="text-xs">
                  <strong className="text-red-400 block uppercase">Crisis Status Assessment: High Alert</strong>
                  <span className="text-slate-400 block mt-0.5">Auto-escalation engine has bypassed normal HOD routing for unresolved high-priority delays.</span>
                </div>
              </div>

              <div className="space-y-4">
                {complaints.filter(c => c.status === 'Escalated' || c.escalatedToAdmin || c.priority === 'Critical').map(c => (
                  <div key={c.id} className="p-5 rounded-2xl bg-[#030712]/60 border border-red-500/20 shadow-md hover:border-red-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-[2px] bg-red-500" />
                    
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-red-400">{c.id}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold uppercase font-mono tracking-wider animate-pulse">
                          Escalated
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase">{c.category}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-100">{c.title}</h4>
                      <p className="text-xs text-slate-450 leading-relaxed font-medium">"{c.description}"</p>
                      {c.escalationReason && (
                        <p className="text-xs text-red-300 bg-red-950/20 p-2.5 rounded-lg border border-red-500/10 font-medium">
                          <strong>Escalation Vector:</strong> {c.escalationReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEmergencyModalId(c.id)}
                        className="py-2 px-3.5 bg-red-650 hover:bg-red-550 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                      >
                        Bypass & Response
                      </button>
                      <button
                        onClick={() => setSelectedComplaintId(c.id)}
                        className="py-2 px-3.5 rounded-xl border border-slate-800 bg-[#030712] text-slate-350 text-xs font-bold hover:border-slate-700 transition-colors"
                      >
                        Trace Timeline
                      </button>
                    </div>
                  </div>
                ))}
                {complaints.filter(c => c.status === 'Escalated' || c.escalatedToAdmin || c.priority === 'Critical').length === 0 && (
                  <div className="text-center py-20 border border-dashed border-slate-850 rounded-xl bg-[#030712]/30">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">No escalated complaints in war room queue</p>
                    <p className="text-xs text-slate-650 mt-1">Campus-wide SLA monitoring reports zero critical breaches.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SYSTEM SECURITY CONTROLS */}
          {activeTab === 'security' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">System Gateway Security Gate</h3>
                  <p className="text-xs text-slate-500 mt-1">Audit security logs, checksum signatures, and track gateways access parameters.</p>
                </div>
                <button
                  onClick={() => {
                    const newAlert = {
                      id: `sec-${Date.now()}`,
                      msg: `Admin manual security verification sweep performed successfully by Director Sarah`,
                      type: 'Info' as const,
                      time: new Date().toISOString()
                    };
                    setSecurityAlerts(prev => [newAlert, ...prev]);
                    alert('Security diagnostic sweep completed. All nodes verified.');
                  }}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-500 rounded-xl text-white text-xs font-bold transition-all"
                >
                  Verify All Gateway Nodes
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Security parameters grid */}
                <div className="lg:col-span-2 space-y-4">
                  <span className="block text-xs font-bold text-rose-400 uppercase tracking-widest font-mono">System Integrity Alerts</span>
                  <div className="space-y-3">
                    {securityAlerts.map(a => (
                      <div key={a.id} className="p-4 bg-[#030712]/50 border border-slate-850 rounded-xl text-xs space-y-2 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            a.type === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : a.type === 'Warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>{a.type}</span>
                          <p className="text-slate-200 font-semibold">{a.msg}</p>
                          <span className="text-[9px] text-slate-500 font-mono block pt-1">{new Date(a.time).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => setSecurityAlerts(prev => prev.filter(item => item.id !== a.id))}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checksums & diagnostic indicators */}
                <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4 h-fit">
                  <span className="block text-xs font-bold text-rose-400 uppercase tracking-widest font-mono border-b border-slate-900 pb-2">Institutional Checksums</span>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="block text-slate-500 font-mono font-bold mb-1">Campus API checksum key</span>
                      <code className="block bg-[#030712] border border-slate-900 p-2.5 rounded-lg text-slate-400 font-mono text-[10px] break-all">
                        SHA256: d14a028c2a3a2bc9476102bb2882300c1df0b
                      </code>
                    </div>

                    <div>
                      <span className="block text-slate-500 font-mono font-bold mb-1">Gateway security node</span>
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <ShieldCheck size={14} />
                        <span>All systems online</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 8: BROADCAST ANNOUNCEMENT NOTICE BOARD */}
          {activeTab === 'broadcast' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Form left */}
              <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4 h-fit">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Megaphone size={18} className="text-rose-400 text-glow-red" />
                  <span>Send Broadcast announcement notice</span>
                </h3>

                <form onSubmit={handleAddBroadcast} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Notice Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ERP System Maintenance"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/30 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Notice Category</label>
                    <select
                      value={broadcastCategory}
                      onChange={(e) => setBroadcastCategory(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="General Notification">General Notification</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Safety Alert">Safety Alert</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Message Description</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your institutional announcement message..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/30 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    Broadcast Announcement
                  </button>
                </form>
              </div>

              {/* Roster right */}
              <div className="xl:col-span-2 rounded-2xl bg-[#090f23]/60 border border-slate-800 p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">
                  Historical Broadcast Notices Roster
                </h3>

                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {broadcasts.map(b => (
                    <div key={b.id} className="p-4 bg-[#030712]/50 border border-slate-850 rounded-xl space-y-2 relative">
                      <span className="absolute top-4 right-4 text-[9px] font-mono text-slate-500">
                        {new Date(b.timestamp).toLocaleString()}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold uppercase font-mono tracking-wider">
                        {b.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-200 mt-1">{b.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{b.message}</p>
                      
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setBroadcasts(prev => prev.filter(item => item.id !== b.id))}
                          className="text-xs text-red-400 font-bold"
                        >
                          Delete Broadcast
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 9: COMPLAINT AUDIT TRAILS */}
          {activeTab === 'logs' && (
            <div className="rounded-2xl bg-[#090f23]/60 border border-slate-800 p-8 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Database System Logs</h3>
                  <p className="text-xs text-slate-500 mt-1">Unalterable logs verifying system activity, administrative warnings, escalations, and freezes.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => simulateExport('CSV')}
                    className="py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Export CSV</span>
                  </button>
                  <button 
                    onClick={() => simulateExport('PDF')}
                    className="py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-[#030712]/50 border border-slate-850 rounded-xl space-y-2 hover:border-slate-800 transition-colors">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-semibold font-mono">
                      <span className="uppercase text-rose-450 font-bold tracking-wide">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed font-medium">{log.details}</p>
                    <div className="text-[10px] text-slate-500 font-mono font-bold border-t border-slate-900/60 pt-2 flex justify-between">
                      <span>Ref ID: {log.complaintId} | Title: "{log.complaintTitle}"</span>
                      <span>Role: {log.userRole} | Action by: {log.userName}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Modal: Superuser complaint timeline auditor */}
      <Modal
        isOpen={selectedComplaint !== undefined}
        onClose={() => setSelectedComplaintId(null)}
        title={selectedComplaint ? `Superuser Case Trace: ${selectedComplaint.id}` : ''}
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6 animate-scaleUp">
            
            {/* Decrypted student credentials grid */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs font-mono leading-relaxed space-y-2">
              <div className="flex items-center gap-2 border-b border-rose-900/50 pb-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span className="font-bold uppercase tracking-wider">Superuser Decrypted Student Metadata</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-300">
                <span>Name: <strong className="text-rose-450">{selectedComplaint.studentName}</strong></span>
                <span>ID: <strong className="text-slate-100">{selectedComplaint.studentId}</strong></span>
                <span>Email: <strong className="text-slate-100">{selectedComplaint.studentEmail}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Case Target Info</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs font-mono text-slate-400">
                <div>
                  <span className="block text-slate-500 font-bold uppercase mb-0.5">Category</span>
                  <span className="text-slate-200 font-semibold">{selectedComplaint.category}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase mb-0.5">Status</span>
                  <span className="text-slate-200 font-semibold">{selectedComplaint.status}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase mb-0.5">Assigned Target</span>
                  <span className="text-slate-200 font-semibold">{selectedComplaint.assignedTeacherName}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase mb-0.5">Upvotes Log</span>
                  <span className="text-slate-200 font-semibold">{selectedComplaint.supportCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Subject Matter description</span>
              <h4 className="text-xl font-bold text-slate-200">{selectedComplaint.title}</h4>
              <p className="text-sm text-slate-350 leading-relaxed bg-[#030712]/30 border border-slate-900 p-4 rounded-xl whitespace-pre-line">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Warnings list on this complaint */}
            {selectedComplaint.warnings && selectedComplaint.warnings.length > 0 && (
              <div className="p-4 bg-amber-950/15 border border-amber-500/20 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">Issued Faculty Warnings</span>
                <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                  {selectedComplaint.warnings.map((w, index) => (
                    <div key={w.id || index} className="p-3 bg-[#030712]/60 rounded-lg border border-slate-900 text-xs">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Notice #{index + 1} | {w.remark}</span>
                        <span>{new Date(w.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-350 mt-1 font-medium">{w.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disciplinary actions list */}
            {selectedComplaint.disciplinaryActions && selectedComplaint.disciplinaryActions.length > 0 && (
              <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-red-400 uppercase tracking-widest font-mono">Strict Disciplinary Actions Dispatch logs</span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {selectedComplaint.disciplinaryActions.map((d, index) => (
                    <div key={d.id || index} className="p-3 bg-[#030712]/50 rounded-lg border border-slate-900 text-xs">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Action #{index + 1} | {d.actionType}</span>
                        <span>{new Date(d.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Superuser controls overlay */}
            {selectedComplaint.status !== 'Closed' && (
              <div className="p-4 bg-slate-950 border border-rose-950/50 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-rose-450 uppercase tracking-widest font-mono">Strict Action Center Overrides</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setEmergencyModalId(selectedComplaint.id)}
                    className="py-2 px-3 bg-red-650 hover:bg-red-550 rounded-lg text-white text-xs font-bold"
                  >
                    Engage Emergency Mode
                  </button>
                  <button
                    onClick={() => setStrictActionModalId(selectedComplaint.id)}
                    className="py-2 px-3 bg-rose-950/30 border border-rose-800/40 hover:bg-rose-950/50 rounded-lg text-rose-400 text-xs font-bold"
                  >
                    Strict Disciplinary Action
                  </button>
                  <button
                    onClick={() => {
                      setRerouteCategory(selectedComplaint.category as any);
                      setRerouteModalId(selectedComplaint.id);
                    }}
                    className="py-2 px-3 bg-amber-950/20 border border-amber-800/40 hover:bg-amber-950/40 rounded-lg text-amber-400 text-xs font-bold"
                  >
                    Re-Route Department
                  </button>
                  <button
                    onClick={() => {
                      setOverrideResolution(selectedComplaint.resolutionDetails || '');
                      setOverrideModalId(selectedComplaint.id);
                    }}
                    className="py-2 px-3 bg-indigo-950/20 border border-indigo-800/40 hover:bg-indigo-950/40 rounded-lg text-indigo-400 text-xs font-bold"
                  >
                    Override Resolution
                  </button>
                  <button
                    onClick={() => setReopenModalId(selectedComplaint.id)}
                    className="py-2 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-350 text-xs font-bold"
                  >
                    Force Reopen Complaint
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-slate-900 pt-4">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">Institutional Roadmap progress</span>
              <ComplaintTimeline status={selectedComplaint.status} />
            </div>

            <div className="border-t border-slate-900 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedComplaintId(null)}
                className="py-2.5 px-6 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-sm font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 transform"
              >
                Close Trace
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* Modal: Emergency response mode setup */}
      <Modal
        isOpen={emergencyModalId !== null}
        onClose={() => setEmergencyModalId(null)}
        title="Engage Campus Emergency Response Mode"
      >
        <form onSubmit={handleEmergencySubmit} className="space-y-4 animate-scaleUp text-slate-350">
          <div className="p-3 bg-red-950/15 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold leading-relaxed flex gap-2">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>Operational Directive: Raising case status to emergency. Dispatches rapid campus teams and sets priority to Critical.</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#030712] border border-slate-900 rounded-xl">
            <span className="text-sm font-bold text-slate-300">Assign Rapid Response Team</span>
            <input
              type="checkbox"
              checked={rapidResponseTeam}
              onChange={(e) => setRapidResponseTeam(e.target.checked)}
              className="w-4 h-4 accent-red-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#030712] border border-slate-900 rounded-xl">
            <span className="text-sm font-bold text-slate-300">Notify Institutional Higher Authorities</span>
            <input
              type="checkbox"
              checked={emergencyAuthorityAlert}
              onChange={(e) => setEmergencyAuthorityAlert(e.target.checked)}
              className="w-4 h-4 accent-red-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setEmergencyModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
            >
              Dispatch Emergency Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Re-Route Department */}
      <Modal
        isOpen={rerouteModalId !== null}
        onClose={() => setRerouteModalId(null)}
        title="Institutional Re-Route Department Command"
      >
        <form onSubmit={handleRerouteSubmit} className="space-y-4 animate-scaleUp text-slate-350">
          <div className="p-3 bg-amber-950/15 border border-amber-500/20 rounded-xl text-xs text-amber-400 font-bold leading-relaxed flex gap-2">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>Administrative Command: Transferring this grievance to a new department will automatically clear old teacher mappings, reset status to Submitted, and notify the new assigned department head.</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Target Department</label>
            <select
              value={rerouteCategory}
              onChange={(e) => setRerouteCategory(e.target.value as any)}
              className="w-full bg-[#030712] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none cursor-pointer"
            >
              <option value="Maintenance">Maintenance</option>
              <option value="Lecturer / ERP / Marks">Lecturer / ERP / Marks</option>
              <option value="Harassment">Harassment</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setRerouteModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              Execute Re-Route Command
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Strict Disciplinary action dispatch center center */}
      <Modal
        isOpen={strictActionModalId !== null}
        onClose={() => setStrictActionModalId(null)}
        title="Strict Disciplinary Action center override"
      >
        <form onSubmit={handleStrictActionSubmit} className="space-y-4 animate-scaleUp text-slate-350">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Disciplinary Action Type</label>
            <select
              value={strictActionType}
              onChange={(e) => setStrictActionType(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none cursor-pointer"
            >
              <option value="Mark Negligence">Mark Negligence</option>
              <option value="Suspend Teacher Access">Suspend Teacher Access</option>
              <option value="Issue Disciplinary Warning">Issue Disciplinary Warning</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Action Details & Reasons</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Failure to comply withMarks discrepancy escalation timer..."
              value={disciplinaryDetails}
              onChange={(e) => setDisciplinaryDetails(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/30 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setStrictActionModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Dispatch Strict Override
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Force Reopen Complaint */}
      <Modal
        isOpen={reopenModalId !== null}
        onClose={() => setReopenModalId(null)}
        title="Force Reopen Complaint"
      >
        <form onSubmit={handleReopenSubmit} className="space-y-4 animate-scaleUp text-slate-350">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Reason for Force Reopening</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Unsatisfactory resolution of WiFi 3rd floor..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-rose-500/30 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setReopenModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Force Reopen Case
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Override Resolution details */}
      <Modal
        isOpen={overrideModalId !== null}
        onClose={() => setOverrideModalId(null)}
        title="Override Resolution details"
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4 animate-scaleUp text-slate-350">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Resolution Override description</label>
            <textarea
              required
              rows={3}
              placeholder="Modify resolution explanation parameters..."
              value={overrideResolution}
              onChange={(e) => setOverrideResolution(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 focus:border-indigo-500/30 rounded-xl py-2.5 px-3 text-sm text-slate-200 outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setOverrideModalId(null)}
              className="py-2.5 px-4 rounded-xl border border-slate-800 text-slate-450 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold"
            >
              Apply Override
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Priority */}
      <Modal
        isOpen={priorityModalId !== null}
        onClose={() => setPriorityModalId(null)}
        title="Admin Override: Complaint Priority Status"
      >
        <form onSubmit={handlePrioritySubmit} className="space-y-4 animate-scaleUp text-slate-300">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Select Priority Level</label>
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
              className="py-2.5 px-5 rounded-xl bg-orange-650 hover:bg-orange-550 text-white text-xs font-bold"
            >
              Force Adjust Priority
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
