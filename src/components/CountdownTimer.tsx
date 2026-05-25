'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string;
  status: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, status }) => {
  const [timeLeft, setTimeLeft] = useState<string>('24:00:00');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [isBreached, setIsBreached] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'Resolved' || status === 'Closed' || status === 'Submitted' || endTime === 'pending') {
      return;
    }

    const calculateTime = () => {
      const difference = +new Date(endTime) - +new Date();
      
      if (difference <= 0) {
        setTimeLeft('00:00:00');
        setIsBreached(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const pad = (n: number) => n.toString().padStart(2, '0');
      
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      
      // If less than 4 hours remaining, mark as urgent
      if (hours < 4) {
        setIsUrgent(true);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [endTime, status]);

  if (status === 'Submitted' || endTime === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-extrabold font-mono tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.1)]">
        <Clock size={12} className="text-blue-400 shrink-0 animate-pulse" />
        <span>SLA PENDING (AWAITING SEEN)</span>
      </div>
    );
  }

  if (status === 'Resolved' || status === 'Closed') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
        <ShieldCheck size={13} className="text-emerald-400" />
        <span>SLA MET</span>
      </div>
    );
  }

  if (status === 'Escalated' || isBreached) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
        <AlertTriangle size={13} className="text-rose-400" />
        <span>SLA BREACHED</span>
      </div>
    );
  }

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all duration-300
        ${isUrgent 
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)] animate-pulse' 
          : 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
        }
      `}
    >
      <Clock size={13} className={isUrgent ? 'animate-spin-slow' : ''} />
      <span>{timeLeft} Left</span>
    </div>
  );
};
export default CountdownTimer;
