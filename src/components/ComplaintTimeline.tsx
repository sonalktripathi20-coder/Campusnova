import React from 'react';
import { ComplaintStatus } from '../lib/types';
import { Check, AlertOctagon, Hourglass, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface ComplaintTimelineProps {
  status: ComplaintStatus;
  onStatusClick?: (status: ComplaintStatus) => void;
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ status, onStatusClick }) => {
  const stages: { label: ComplaintStatus; desc: string }[] = [
    { label: 'Submitted', desc: 'Case received' },
    { label: 'Seen', desc: 'Reviewed by staff' },
    { label: 'In Progress', desc: 'Action started' },
    { label: 'Escalated', desc: 'Overdue SLA' },
    { label: 'Resolved', desc: 'Solution ready' },
    { label: 'Closed', desc: 'Feedback locked' },
  ];

  // Helper to determine stage state
  const getStageIndex = (currentStatus: ComplaintStatus) => {
    switch (currentStatus) {
      case 'Submitted': return 0;
      case 'Seen': return 1;
      case 'In Progress': return 2;
      case 'Escalated': return 3;
      case 'Resolved': return 4;
      case 'Closed': return 5;
      default: return 0;
    }
  };

  const currentIdx = getStageIndex(status);

  // Helper styles for circles
  const getStageStyles = (idx: number) => {
    const isEscalatedActive = status === 'Escalated';

    if (idx === 3) {
      if (isEscalatedActive) {
        return {
          bg: 'bg-rose-500/20 border-rose-500/80 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse scale-105',
          icon: ShieldAlert
        };
      } else {
        return {
          bg: 'bg-[#030712] border-white/[0.08] text-slate-600',
          icon: AlertOctagon
        };
      }
    }

    if (idx < currentIdx) {
      return {
        bg: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
        icon: Check
      };
    } else if (idx === currentIdx) {
      return {
        bg: 'bg-blue-500/25 border-blue-500/80 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse scale-105',
        icon: Hourglass
      };
    } else {
      return {
        bg: 'bg-[#030712] border-white/[0.08] text-slate-500',
        icon: HelpCircle
      };
    }
  };

  return (
    <div className="w-full py-6 overflow-x-auto scrollbar-none">
      <div className="min-w-[700px] max-w-5xl mx-auto flex items-start justify-between relative px-6 select-none">
        
        {/* Horizontal Connecting lines track (Aligned exactly at center of circles top-6) */}
        <div className="absolute top-6 left-12 right-12 h-[3px] bg-white/[0.06] z-0 rounded-full" />
        
        {/* Complete dynamic progress track */}
        <div 
          className="absolute top-6 left-12 h-[3px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-700 ease-in-out z-0 rounded-full"
          style={{ 
            width: `${(currentIdx / 5) * 88}%` 
          }}
        />

        {stages.map((stage, idx) => {
          const styles = getStageStyles(idx);
          const Icon = styles.icon;
          const isActive = idx === currentIdx;
          const isPassed = idx < currentIdx;
          const isClickable = !!onStatusClick;

          return (
            <div 
              key={stage.label} 
              onClick={() => onStatusClick?.(stage.label)}
              className={`flex flex-col items-center relative z-10 min-w-[100px] transition-all ${
                isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
              }`}
            >
              <div 
                className={`
                  w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300
                  ${styles.bg}
                `}
              >
                <Icon size={18} className={isActive ? 'animate-spin-slow' : ''} />
              </div>
              <div className="mt-3 text-center">
                <span className={`
                  block text-sm font-extrabold font-sans tracking-wide transition-colors duration-300 uppercase
                  ${isActive ? 'text-blue-400 text-glow-blue' : isPassed ? 'text-emerald-400' : 'text-slate-400'}
                  ${idx === 3 && status === 'Escalated' ? 'text-rose-400 text-glow-red' : ''}
                `}>
                  {stage.label}
                </span>
                <span className="block text-xs text-slate-500 mt-1 font-bold tracking-widest uppercase">
                  {stage.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplaintTimeline;
