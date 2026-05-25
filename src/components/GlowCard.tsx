import React from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'cyan' | 'purple' | 'green' | 'red' | 'orange';
  hoverEffect?: boolean;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blue',
  hoverEffect = true,
}) => {
  const glowClasses = {
    blue: 'border-blue-500/20 hover:border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.05)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    purple: 'border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    green: 'border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    red: 'border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.05)] hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    orange: 'border-orange-500/20 hover:border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.05)] hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
  };

  return (
    <div
      className={`
        relative rounded-2xl border bg-[#0b1329]/45 backdrop-blur-xl p-6 
        transition-all duration-300 ease-out
        ${glowClasses[glowColor]}
        ${hoverEffect ? 'hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {/* Glow highlight filter layer */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
export default GlowCard;
