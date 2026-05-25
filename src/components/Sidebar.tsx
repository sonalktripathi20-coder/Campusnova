'use client';

import React from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  LayoutDashboard, 
  PlusSquare, 
  History, 
  BarChart2, 
  LogOut,
  AlertOctagon,
  Award,
  Clock,
  Activity,
  FolderLock,
  Search,
  Users,
  ShieldCheck,
  Megaphone,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  showNotificationPanel?: boolean;
  setShowNotificationPanel?: (show: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'dashboard',
  setActiveTab = () => {},
  showNotificationPanel = false,
  setShowNotificationPanel = () => {},
}) => {
  const { currentUser, logout } = usePortal();

  if (!currentUser) return null;

  // Get navigation links based on role
  const getNavItems = () => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { id: 'create', label: 'Submit Complaint', icon: PlusSquare },
          { id: 'history', label: 'Complaint History', icon: History },
        ];
      case 'teacher':
        return [
          { id: 'dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard },
        ];
      case 'hod':
        return [
          { id: 'dashboard', label: 'Department Dashboard', icon: LayoutDashboard },
          { id: 'faculty', label: 'Teacher Performance', icon: Award },
          { id: 'reviews', label: 'Pending Verification', icon: ShieldCheck },
          { id: 'sla', label: 'SLA Monitoring', icon: Clock },
          { id: 'analytics', label: 'Department Analytics', icon: BarChart2 },
          { id: 'notes', label: 'Internal Notes', icon: History },
          { id: 'logs', label: 'Activity Logs', icon: Activity },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Central Dashboard', icon: LayoutDashboard },
          { id: 'control', label: 'Complaint Control Center', icon: FolderLock },
          { id: 'investigation', label: 'Investigation Center', icon: Search },
          { id: 'war_room', label: 'Critical Escalation War Room', icon: AlertOctagon },
          { id: 'analytics', label: 'Global Analytics', icon: BarChart2 },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'security', label: 'Security Operations', icon: ShieldCheck },
          { id: 'broadcast', label: 'Broadcast Center', icon: Megaphone },
          { id: 'logs', label: 'Activity Logs', icon: FileSpreadsheet },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: 'student (Student)',
      teacher: 'teacher (Teacher)',
      hod: 'hod (HOD)',
      admin: 'admin (Admin)',
    };
    return labels[role] || role;
  };

  const getRoleStyles = () => {
    if (currentUser.role === 'hod') {
      return {
        activeBg: 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        iconColor: 'text-emerald-400 text-glow-green',
        glowHeader: 'text-emerald-400 text-glow-green',
        roleText: 'text-emerald-400 font-bold font-mono text-xs px-2 py-1 rounded-md bg-emerald-950/50 border border-emerald-800/40 inline-block mt-2 tracking-widest uppercase'
      };
    }
    if (currentUser.role === 'admin') {
      return {
        activeBg: 'bg-rose-600/15 text-rose-400 border border-rose-500/35 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        iconColor: 'text-rose-400 text-glow-red',
        glowHeader: 'text-rose-400 text-glow-red',
        roleText: 'text-rose-450 font-bold font-mono text-xs px-2 py-1 rounded-md bg-rose-950/50 border border-rose-800/40 inline-block mt-2 tracking-widest uppercase font-black'
      };
    }
    return {
      activeBg: 'bg-blue-600/15 text-blue-400 border border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
      iconColor: 'text-blue-400 text-glow-blue',
      glowHeader: 'text-cyan-400 text-glow-cyan',
      roleText: 'text-slate-400 font-bold uppercase tracking-wider mt-3 block text-sm'
    };
  };

  const roleStyle = getRoleStyles();

  return (
    <div className="w-[260px] h-full overflow-y-auto bg-[#070b19] border-r border-[#121c38] flex flex-col justify-between py-8 px-6 z-30 shrink-0 select-none">
      
      {/* Brand Header & Active Role Info */}
      <div>
        <div className="mb-10">
          <h1 className={`text-3xl font-black tracking-wide font-sans leading-none ${roleStyle.glowHeader}`}>
            Grievance Portal
          </h1>
          <span className={roleStyle.roleText}>
            {getRoleLabel(currentUser.role)}
          </span>
        </div>

        {/* Premium Navigation Tabs */}
        <nav className="space-y-3 mt-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setShowNotificationPanel(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[16px] font-bold transition-all cursor-pointer relative group
                  ${isActive 
                    ? roleStyle.activeBg 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                  }
                `}
              >
                <Icon size={22} className={`transition-transform group-hover:scale-105 ${isActive ? roleStyle.iconColor : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Row with Clean Logout */}
      <div className="border-t border-[#121c38] pt-6 mt-auto space-y-5">
        <div className="flex items-center gap-3 px-1">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-[#1e2e5a] flex items-center justify-center font-bold text-lg text-slate-300">
            {currentUser.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-extrabold text-slate-200 truncate">{currentUser.name}</h4>
            <span className="text-sm text-slate-500 truncate block mt-0.5 font-medium">
              {currentUser.email}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3.5 px-4 py-3 text-base font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
