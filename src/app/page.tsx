'use client';

import React, { useState, useEffect } from 'react';
import { usePortal } from '@/context/PortalContext';
import { Sidebar } from '@/components/Sidebar';
import { GlowCard } from '@/components/GlowCard';
import { Modal } from '@/components/Modal';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle, 
  KeyRound, 
  Calendar,
  Bell, 
  Search,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  FolderOpen,
  Activity,
  Shield,
  Zap,
  Server,
  UserCheck,
  Radar,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

// Import dashboards directly for fluid SPA feeling
import StudentDashboard from './student/page';
import TeacherDashboard from './teacher/page';
import HodDashboard from './hod/page';
import AdminDashboard from './admin/page';

export default function MasterPortalPage() {
  const { currentUser, login, notifications, dismissNotification, complaints } = usePortal();
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Dashboard view states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number | null>(null);

  // 3D Card Tilt Effect Hooks
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const mouseXSpring = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPct = x / width - 0.5;
    const yPct = y / height - 0.5;
    
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Time ticker state
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' | ' + d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Preset demo account credentials for easy logging
  const demoAccounts = [
    { name: 'Sonal (Student)', email: 'sonal@student.edu', pass: 'Sonal@123', role: 'student' },
    { name: 'Kumkum (Student)', email: 'kumkum@student.edu', pass: 'Kumkum@123', role: 'student' },
    { name: 'Roshan (Student)', email: 'roshan@student.edu', pass: 'Roshan@123', role: 'student' },
    { name: 'Prof. Kashif (Teacher)', email: 'kashif@teacher.edu', pass: 'Kashif@123', role: 'teacher' },
    { name: 'Maintenance (Teacher)', email: 'maintenance@teacher.edu', pass: 'Maintain@123', role: 'teacher' },
    { name: 'Grievance (Teacher)', email: 'grievance@teacher.edu', pass: 'Grievance@123', role: 'teacher' },
    { name: 'Dr. Anand (HOD)', email: 'hod@college.edu', pass: 'Hod@123', role: 'hod' },
    { name: 'Director Sarah (Admin)', email: 'admin@college.edu', pass: 'Admin@123', role: 'admin' }
  ];

  const handleDemoClick = (idx: number) => {
    setSelectedDemoIndex(idx);
    setEmail(demoAccounts[idx].email);
    setPassword(demoAccounts[idx].pass);
    setLoginError(null);
    setShowDemoModal(false); // Close modal on choice
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Institutional Email and password fields are required.');
      return;
    }
    
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const res = await login(email, password);
      if (!res.success) {
        setLoginError(res.error || 'Authentication failed.');
      } else {
        // Reset navigation tab
        setActiveTab('dashboard');
        setShowNotifPanel(false);
      }
    } catch (err) {
      setLoginError('System connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered notifications specifically for the logged in user's role
  const userNotifications = currentUser 
    ? notifications.filter(n => {
        if (n.recipientId && n.recipientId === currentUser.id) return true;
        if (n.recipientRole && n.recipientRole === currentUser.role) return true;
        return false;
      })
    : [];

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const activeComplaints = complaints?.filter(c => c.status !== 'Closed' && c.status !== 'Resolved').length || 0;
  const criticalCases = complaints?.filter(c => c.priority === 'Critical').length || 0;
  const resolvedCases = complaints?.filter(c => c.status === 'Resolved' || c.status === 'Closed').length || 0;
  const resolutionRate = complaints?.length ? Math.round((resolvedCases / complaints.length) * 100) : 0;

  // Render Login view if user is logged out
  if (!currentUser) {
    return (
      <main className="min-h-screen w-full flex flex-col xl:flex-row bg-[#030614] relative overflow-hidden font-sans selection:bg-blue-500/30">
        
        {/* GLOBAL BACKGROUND EFFECTS */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Cyber Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
          
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

          {/* Deep Animated Glowing Blobs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[150px] mix-blend-screen" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] rounded-full bg-purple-600/10 blur-[160px] mix-blend-screen" 
          />

          {/* Floating Particles */}
          <div className="absolute inset-0">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full bg-cyan-400"
                style={{
                  width: Math.random() * 3 + 1 + 'px',
                  height: Math.random() * 3 + 1 + 'px',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  filter: 'blur(1px)'
                }}
                animate={{
                  y: [0, Math.random() * -100 - 50, 0],
                  x: [0, Math.random() * 50 - 25, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: Math.random() * 5
                }}
              />
            ))}
          </div>
        </div>

        {/* LEFT PANEL - HERO SHOWCASE */}
        <div className="hidden xl:flex xl:w-[55%] flex-col justify-between relative z-10 px-10 py-8 border-r border-slate-800/50 backdrop-blur-[2px]">
          
          <div className="space-y-6 max-w-2xl relative z-20">
            <motion.div 
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(59,130,246,0.15)] mb-6">
                <Sparkles size={14} className="text-cyan-400" /> V2.0 Ecosystem Online
              </div>
              
              <h1 className="text-5xl xl:text-[4.5rem] font-black tracking-tighter leading-[1.05] drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                <span className="bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">CAMPUS</span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">NOVA</span>
              </h1>
              
              <h2 className="text-xl xl:text-2xl font-bold text-slate-200 mt-3 tracking-wide drop-shadow-md">
                Where Student Voices Create Real Change.
              </h2>
              
              <p className="text-sm xl:text-base text-slate-400 font-medium leading-relaxed mt-3 drop-shadow-md border-l-2 border-cyan-500/50 pl-4">
                AI-powered grievance resolution ecosystem with automated escalation, SLA intelligence, protected identity systems, and real-time institutional governance.
              </p>
            </motion.div>

            {/* Feature Chips */}
            <motion.div 
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap gap-2 pt-4"
            >
              {[
                'AI Escalation Engine', 'Smart SLA Monitoring', 'Protected Identity Mode', 
                'Emergency Resolution', 'Campus Analytics', 'Anonymous Reporting'
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-3 py-1.5 rounded-xl bg-[#091024]/80 border border-slate-700/80 text-slate-300 text-xs font-bold shadow-lg hover:border-cyan-500/50 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-default flex items-center gap-2"
                >
                  <CheckCircle size={14} className="text-blue-500" /> {feature}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Holographic AI Core Centerpiece - Ultra 3D */}
          <div className="absolute top-1/2 left-[60%] -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none z-0 opacity-60 mix-blend-screen" style={{ perspective: "1200px" }}>
            {/* Outer Orbit */}
            <motion.div 
              animate={{ rotateZ: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[5%] border-[1px] border-dashed border-cyan-500/30 rounded-full"
              style={{ rotateX: 65, rotateY: 25, transformStyle: "preserve-3d", boxShadow: "0 0 30px rgba(6,182,212,0.1), inset 0 0 30px rgba(6,182,212,0.1)" }}
            />
            {/* Mid Orbit */}
            <motion.div 
              animate={{ rotateZ: -360, scale: [1, 1.02, 1] }}
              transition={{ 
                rotateZ: { duration: 40, repeat: Infinity, ease: 'linear' },
                scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="absolute inset-[18%] border-[2px] border-dotted border-blue-400/50 rounded-full"
              style={{ rotateX: 75, rotateY: -15, transformStyle: "preserve-3d", boxShadow: "0 0 40px rgba(59,130,246,0.2), inset 0 0 40px rgba(59,130,246,0.2)" }}
            />
            {/* Inner Orbit */}
            <motion.div 
              animate={{ rotateZ: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[30%] border-[2px] border-solid border-indigo-400/40 rounded-full"
              style={{ rotateX: 85, rotateY: 35, transformStyle: "preserve-3d", boxShadow: "0 0 50px rgba(99,102,241,0.3), inset 0 0 50px rgba(99,102,241,0.3)" }}
            />
            {/* Energy Core */}
            <div className="absolute inset-[40%] rounded-full bg-gradient-to-tr from-cyan-600/20 via-blue-600/30 to-purple-600/20 blur-xl shadow-[0_0_120px_rgba(6,182,212,0.5)] flex items-center justify-center">
               <motion.div 
                 animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                 className="w-24 h-24 bg-cyan-300/50 rounded-full blur-2xl"
               />
               <motion.div 
                 animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.9, 0.5] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                 className="absolute w-12 h-12 bg-white/60 rounded-full blur-lg"
               />
            </div>
          </div>

          {/* Premium Live Stats Dashboard */}
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 relative z-20"
          >
            {[
              { label: 'Active Issues', val: activeComplaints, icon: <Activity />, borderHover: 'hover:border-cyan-500/50', iconCol: 'text-cyan-400' },
              { label: 'Resolution Rate', val: `${resolutionRate}%`, icon: <TrendingUp />, borderHover: 'hover:border-emerald-500/50', iconCol: 'text-emerald-400' },
              { label: 'Escalations', val: criticalCases, icon: <AlertCircle />, borderHover: 'hover:border-rose-500/50', iconCol: 'text-rose-400' },
              { label: 'AI Status', val: 'ONLINE', icon: <Radar />, borderHover: 'hover:border-blue-500/50', iconCol: 'text-blue-400' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ 
                  y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }
                }}
                className={`p-4 rounded-2xl bg-[#060b18]/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl transition-all group ${stat.borderHover}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform ${stat.iconCol}`}>
                    {stat.icon}
                  </div>
                  {i === 3 && (
                    <div className="flex items-end gap-[3px] h-3">
                      <motion.div animate={{ height: [4, 12, 4] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} className="w-1 bg-cyan-400 rounded-full" />
                      <motion.div animate={{ height: [8, 4, 8] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} className="w-1 bg-blue-400 rounded-full" />
                      <motion.div animate={{ height: [4, 10, 4] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} className="w-1 bg-indigo-400 rounded-full" />
                    </div>
                  )}
                </div>
                <span className="block text-2xl font-black text-white drop-shadow-md">{stat.val}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT PANEL - AUTHENTICATION */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative z-10">
          
          {/* Mobile Header */}
          <div className="xl:hidden w-full text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
              CAMPUS<span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">NOVA</span>
            </h1>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-[0.2em] mt-2">AI Institutional Network</p>
          </div>

          <motion.div 
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-[460px] relative perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          >
            {/* Ambient Shadow / Glow */}
            <div className="absolute -inset-2 bg-gradient-to-b from-cyan-500/30 via-blue-500/20 to-purple-500/30 rounded-[3rem] blur-3xl opacity-50 pointer-events-none" style={{ transform: "translateZ(-80px)" }} />

            <form onSubmit={handleLoginSubmit} className="relative p-6 md:p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] flex flex-col gap-3 transition-all duration-500 hover:border-white/20 hover:shadow-[0_16px_64px_0_rgba(6,182,212,0.2)]" style={{ transform: "translateZ(40px)" }}>
              {/* Internal Glass Highlights */}
              <div className="absolute inset-0 rounded-[2rem] border-[1px] border-white/5 pointer-events-none" />
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
              
              
              {/* Header */}
              <div className="text-center mb-1">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[#0a122c] border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)] mb-2">
                  <Shield size={24} />
                </div>
                <h2 className="text-lg xl:text-xl font-black text-white tracking-wide">Secure Portal Access</h2>
                <p className="text-[11px] xl:text-xs text-slate-400 mt-1 font-medium">Authenticate to enter the ecosystem.</p>
              </div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-400 text-sm font-bold shadow-[0_0_15px_rgba(225,29,72,0.1)]"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{loginError}</span>
                </motion.div>
              )}

              {/* Form Inputs */}
              <div className="space-y-5">
                {/* Email Input */}
                <div className="relative group/input">
                  <input
                    type="email"
                    id="emailInput"
                    required
                    placeholder=" "
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLoginError(null); }}
                    className="block w-full px-5 pt-6 pb-2 text-sm text-white bg-[#02040a] border border-slate-700/80 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-blue-500/70 peer transition-all duration-300 shadow-inner"
                  />
                  <label 
                    htmlFor="emailInput" 
                    className="absolute text-[11px] text-slate-500 duration-300 transform -translate-y-3 scale-75 top-5 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-blue-400 font-bold tracking-widest uppercase pointer-events-none"
                  >
                    Institutional Email
                  </label>
                  <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 peer-focus:text-blue-400 transition-colors" size={20} />
                </div>

                {/* Password Input */}
                <div className="relative group/input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="passInput"
                    required
                    placeholder=" "
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
                    className="block w-full px-5 pt-6 pb-2 text-sm text-white bg-[#02040a] border border-slate-700/80 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-blue-500/70 peer transition-all duration-300 shadow-inner pr-14"
                  />
                  <label 
                    htmlFor="passInput" 
                    className="absolute text-[11px] text-slate-500 duration-300 transform -translate-y-3 scale-75 top-5 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-blue-400 font-bold tracking-widest uppercase pointer-events-none"
                  >
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white peer-focus:text-blue-400 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Massive CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-black text-sm tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(6,182,212,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6),inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transform overflow-hidden group/btn border border-white/10 transition-all duration-300"
              >
                {/* Advanced Shimmer Sweep */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] skew-x-[-20deg] group-hover/btn:translate-x-[200%] transition-transform duration-[1200ms] ease-in-out -translate-x-[200%]" />
                
                {isLoading ? (
                  <div className="flex items-center gap-2 relative z-10">
                    <RefreshCw className="animate-spin text-white" size={20} />
                    <span>Initiating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 relative z-10">
                    <span>Enter CampusNova</span>
                    <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>

              {/* Sandbox Trigger */}
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="w-full py-2.5 rounded-xl border border-slate-700/50 hover:border-purple-500/40 bg-[#0a122c]/50 hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                <KeyRound size={14} />
                <span>Sandbox Credentials</span>
              </button>
            </form>

            {/* Bottom Security Bar */}
            <div className="mt-3 flex flex-wrap justify-center items-center gap-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">
               <span className="flex items-center gap-1.5"><Lock size={12} className="text-emerald-500" /> E2E Encrypted</span>
               <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-blue-500" /> AI Protected</span>
               <span className="flex items-center gap-1.5"><Activity size={12} className="text-cyan-500" /> Live Monitor</span>
            </div>

            {/* Holographic Role Access Previews */}
            <div className="mt-4 w-full relative perspective-1000">
              <div className="flex items-center justify-between mb-3 px-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Ecosystem Access Tiers</p>
                <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3" style={{ transformStyle: "preserve-3d" }}>
                {[
                  { role: 'Student Network', id: 'TIER-1', icon: <UserCheck size={20}/>, bg: 'from-emerald-500/10 to-teal-500/5', border: 'hover:border-emerald-500/50', text: 'text-emerald-400', glow: 'group-hover:shadow-[0_10px_30px_rgba(16,185,129,0.25)]' },
                  { role: 'Faculty Terminal', id: 'TIER-2', icon: <FileText size={20}/>, bg: 'from-blue-500/10 to-indigo-500/5', border: 'hover:border-blue-500/50', text: 'text-blue-400', glow: 'group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.25)]' },
                  { role: 'Director (HOD)', id: 'TIER-3', icon: <Activity size={20}/>, bg: 'from-purple-500/10 to-fuchsia-500/5', border: 'hover:border-purple-500/50', text: 'text-purple-400', glow: 'group-hover:shadow-[0_10px_30px_rgba(168,85,247,0.25)]' },
                  { role: 'System Admin', id: 'CORE', icon: <Server size={20}/>, bg: 'from-rose-500/10 to-orange-500/5', border: 'hover:border-rose-500/50', text: 'text-rose-400', glow: 'group-hover:shadow-[0_10px_30px_rgba(225,29,72,0.25)]' }
                ].map((r, idx) => (
                  <div
                    key={idx}
                    className={`relative overflow-hidden flex flex-col p-3 rounded-2xl border border-white/[0.06] bg-gradient-to-br ${r.bg} backdrop-blur-md transition-all duration-500 cursor-default ${r.border} ${r.glow} group hover:-translate-y-2 hover:rotate-x-2`}
                  >
                    {/* Hover animated background ray */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.08] to-white/0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className={`p-2 rounded-xl bg-[#030712]/50 border border-white/5 ${r.text} transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6`}>
                        {r.icon}
                      </div>
                      <span className={`text-[9px] font-mono font-bold bg-[#030712]/80 px-2 py-1 rounded-md border border-white/5 transition-colors duration-500 ${r.text} opacity-50 group-hover:opacity-100`}>
                        {r.id}
                      </span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors relative z-10">
                      {r.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>

        {/* Demo Credentials Picker Modal */}
        <Modal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          title="Institutional Sandbox Profiles"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              Select a pre-seeded account profile. The credentials will instantly populate into inputs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDemoClick(idx)}
                  className={`
                    flex items-center justify-between text-left p-3.5 rounded-xl border transition-all cursor-pointer active:scale-98 transform
                    ${selectedDemoIndex === idx
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] font-bold'
                      : 'bg-[#030712] border-white/[0.06] text-slate-400 hover:border-blue-500/30 hover:bg-white/[0.02]'
                    }
                  `}
                >
                  <div>
                    <span className="block text-sm font-bold text-slate-200">{acc.name}</span>
                    <span className="block text-xs text-slate-500 font-mono mt-1">{acc.email}</span>
                  </div>
                  <ChevronRight size={15} className={selectedDemoIndex === idx ? 'text-blue-400 animate-pulse' : 'text-slate-600'} />
                </button>
              ))}
            </div>
          </div>
        </Modal>

      </main>
    );
  }

  // --- RENDER DASHBOARD (Logged In) ---
  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#020617] relative">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
      
      {/* Fixed Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showNotificationPanel={showNotifPanel}
        setShowNotificationPanel={setShowNotifPanel}
      />

      {/* Main Panel Content container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative bg-cyber-grid">
        
        {/* Dashboard Header */}
        <header className="sticky top-0 bg-[#020617]/80 backdrop-blur-md border-b border-white/[0.08] h-20 px-8 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold text-slate-200 capitalize tracking-wide font-sans text-glow-blue">
              {activeTab === 'dashboard' ? `${currentUser.role} Control Center` : activeTab.replace(/([A-Z])/g, ' $1')}
            </h2>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-[#030712] border border-white/[0.08] px-3 py-1.5 rounded-xl font-bold font-mono">
              <Calendar size={14} className="text-slate-500" />
              <span>{timeStr}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search portal logs..."
                className="bg-[#030712]/60 border border-white/[0.08] focus:border-blue-500/40 rounded-full py-2 pl-10 pr-4 text-xs text-slate-300 outline-none w-52 transition-all cursor-text"
              />
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-2.5 rounded-xl bg-[#030712]/40 border border-white/[0.08] hover:border-blue-500/40 text-slate-400 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* Bounded Max-Width Container wrapper for ultra-premium SaaS look */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            
            {showNotifPanel ? (
              /* Dedicated Notifications Screen overlay tab */
              <div className="max-w-2xl mx-auto space-y-6 animate-scaleUp">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-200 font-sans tracking-wide">Alert Center</h3>
                    <p className="text-sm text-slate-400">Real-time status updates and action triggers</p>
                  </div>
                  <div className="text-xs text-slate-300 bg-white/[0.05] px-3 py-1 rounded-xl border border-white/[0.08] font-bold">
                    {unreadCount} Unread Alerts
                  </div>
                </div>

                <div className="space-y-4">
                  {userNotifications.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08] bg-[#090f23]/40">
                      <FolderOpen className="mx-auto text-slate-500 mb-3" size={32} />
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Your alert buffer is empty</p>
                    </div>
                  ) : (
                    userNotifications.map(n => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          dismissNotification(n.id);
                          setActiveTab('dashboard');
                          setShowNotifPanel(false);
                        }}
                        className={`
                          p-5 rounded-2xl border text-sm cursor-pointer transition-all flex items-start justify-between gap-4 hover:scale-[1.01] transform active:scale-99
                          ${n.read 
                            ? 'bg-white/[0.01] border-white/[0.06] text-slate-400 hover:border-white/[0.1]' 
                            : 'bg-blue-600/10 border-blue-500/30 text-slate-200 shadow-md hover:border-blue-500/50'
                          }
                        `}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                            <span className="font-bold text-slate-200">{n.title}</span>
                            <span className="text-xs text-slate-500 font-mono font-medium">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="leading-relaxed text-slate-400">{n.message}</p>
                        </div>
                        <span className="text-xs font-bold text-blue-400 font-mono">{n.complaintId}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Primary Dashboards views */
              <div className="w-full">
                {currentUser.role === 'student' && <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
                {currentUser.role === 'teacher' && <TeacherDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
                {currentUser.role === 'hod' && <HodDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
                {currentUser.role === 'admin' && <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
