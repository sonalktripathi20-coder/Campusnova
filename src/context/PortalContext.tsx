'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Complaint, ActivityLog, Notification, UserRole, ComplaintStatus } from '../lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sgp_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Pre-seeded Demo Users
export const DEMO_USERS: User[] = [
  { id: 'usr-s1', email: 'sonal@student.edu', name: 'Sonal Tripathi', role: 'student', avatar: 'ST' },
  { id: 'usr-s2', email: 'kumkum@student.edu', name: 'Kumkum Sen', role: 'student', avatar: 'KS' },
  { id: 'usr-s3', email: 'roshan@student.edu', name: 'Roshan Kumar', role: 'student', avatar: 'RK' },
  
  { id: 'usr-t1', email: 'academics@teacher.edu', name: 'Prof. Kashif Sheikh', role: 'teacher', department: 'Lecturer / ERP / Marks', avatar: 'KS' },
  { id: 'usr-t2', email: 'maintenance@teacher.edu', name: 'Maintenance Team', role: 'teacher', department: 'Maintenance', avatar: 'MT' },
  { id: 'usr-t3', email: 'grievance@teacher.edu', name: 'Grievance Team', role: 'teacher', department: 'Harassment', avatar: 'GT' },
  
  { id: 'usr-h1', email: 'hod@college.edu', name: 'Dr. Anand Verma (HOD)', role: 'hod', avatar: 'AV' },
  
  { id: 'usr-a1', email: 'admin@college.edu', name: 'Director Sarah (Admin)', role: 'admin', avatar: 'DS' }
];

// Helper to get assignment details based on category
const getAssignmentForCategory = (category: string): { teacherId: string; teacherName: string } => {
  switch (category) {
    case 'Lecturer / ERP / Marks':
      return { teacherId: 'usr-t1', teacherName: 'Prof. Kashif Sheikh' };
    case 'Maintenance':
      return { teacherId: 'usr-t2', teacherName: 'Maintenance Team' };
    case 'Harassment':
      return { teacherId: 'usr-t3', teacherName: 'Grievance Team' };
    default:
      return { teacherId: 'usr-t2', teacherName: 'Maintenance Team' };
  }
};

interface PortalContextType {
  currentUser: User | null;
  complaints: Complaint[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => void;
  createComplaint: (
    title: string,
    description: string,
    category: 'Lecturer / ERP / Marks' | 'Maintenance' | 'Harassment',
    anonymous: boolean,
    protectedIdentity: boolean,
    priority: 'Low' | 'Medium' | 'High' | 'Critical',
    attachments?: string[]
  ) => void;
  updateComplaintPriority: (complaintId: string, priority: 'Low' | 'Medium' | 'High' | 'Critical') => void;
  updateComplaintStatus: (complaintId: string, status: ComplaintStatus) => void;
  resolveComplaint: (complaintId: string, resolutionDetails: string, resolutionRemarks: string) => void;
  reopenComplaint: (complaintId: string, reason: string) => void;
  rateComplaintResolution: (complaintId: string, rating: number, comment: string) => void;
  supportComplaint: (complaintId: string) => void;
  reassignComplaint: (complaintId: string, teacherId: string) => void;
  deleteComplaint: (complaintId: string) => void;
  updateComplaintFields: (complaintId: string, fields: Partial<Complaint>) => void;
  addActivityLog: (complaintId: string, action: string, details: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isFastSlaMode: boolean;
  toggleFastSlaMode: () => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFastSlaMode, setIsFastSlaMode] = useState(false);

  const toggleFastSlaMode = () => {
    setIsFastSlaMode(prev => !prev);
  };

  // Active Sync with Backend Engine
  const syncWithBackend = async () => {
    try {
      const headers = getHeaders();
      const complaintsRes = await fetch(`${BACKEND_URL}/api/complaints`, { headers });
      const logsRes = await fetch(`${BACKEND_URL}/api/logs`, { headers });
      const notifsRes = await fetch(`${BACKEND_URL}/api/notifications`, { headers });

      if (complaintsRes.ok && logsRes.ok && notifsRes.ok) {
        const dbComplaints = await complaintsRes.json();
        const dbLogs = await logsRes.json();
        const dbNotifs = await notifsRes.json();

        const mappedComplaints: Complaint[] = dbComplaints.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          status: c.status,
          anonymous: c.anonymous === 1 || c.anonymous === true,
          protectedIdentity: c.protected_identity === 1 || c.protected_identity === true,
          priority: c.priority || 'Medium',
          studentId: c.student_id,
          studentName: c.student_name,
          studentEmail: c.student_email,
          assignedTeacherId: c.assigned_teacher_id,
          assignedTeacherName: c.assigned_teacher_name,
          supportCount: c.support_count || 0,
          supportedBy: c.supported_by ? JSON.parse(c.supported_by) : [],
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          escalationTimerEnds: c.escalation_timer_ends,
          resolvedAt: c.resolved_at,
          resolvedBy: c.resolved_by,
          resolutionDetails: c.resolution_details,
          resolutionRemarks: c.resolution_remarks,
          feedbackRating: c.feedback_rating,
          feedbackComment: c.feedback_comment,
          reopenedCount: c.reopened_count || 0,
          attachments: c.attachments ? JSON.parse(c.attachments) : []
        }));

        const mappedLogs: ActivityLog[] = dbLogs.map((l: any) => ({
          id: `log-${l.id}`,
          complaintId: l.complaint_id,
          complaintTitle: l.complaint_title,
          userRole: l.user_role,
          userName: l.user_name,
          action: l.action,
          details: l.details,
          timestamp: l.timestamp
        }));

        const mappedNotifs: Notification[] = dbNotifs.map((n: any) => ({
          id: `notif-${n.id}`,
          recipientRole: n.recipient_role,
          recipientId: n.recipient_id,
          title: n.title,
          message: n.message,
          read: n.is_read === 1 || n.is_read === true,
          complaintId: n.complaint_id,
          timestamp: n.timestamp
        }));

        const filteredComplaints = mappedComplaints.filter((c: Complaint) => c.id !== 'GRV-6909' && c.id !== 'GRV-3331');
        const filteredLogs = mappedLogs.filter((l: ActivityLog) => l.complaintId !== 'GRV-6909' && l.complaintId !== 'GRV-3331');
        const filteredNotifs = mappedNotifs.filter((n: Notification) => n.complaintId !== 'GRV-6909' && n.complaintId !== 'GRV-3331');

        setComplaints(filteredComplaints);
        setActivityLogs(filteredLogs);
        setNotifications(filteredNotifs);

        localStorage.setItem('sgp_complaints', JSON.stringify(filteredComplaints));
        localStorage.setItem('sgp_logs', JSON.stringify(filteredLogs));
        localStorage.setItem('sgp_notifs', JSON.stringify(filteredNotifs));
        return true;
      }
    } catch (err) {
      console.warn('⚠️ Sync polling request failed or backend server offline.');
    }
    return false;
  };

  // Initialize and Seed Data (Dual-Mode Integration Check)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load logged-in user session
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('sgp_user');
          if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
          }
        }

        console.log('📡 Syncing with backend database server...');
        const success = await syncWithBackend();
        if (!success) {
          throw new Error('Initial backend sync returned failure status');
        }
        console.log('✅ Real Database synchronization successful!');
      } catch (err) {
        console.warn('⚠️ Real Database server offline. Operating in fallback Sandbox Mode.');
        // Standard Local Storage Fallback
        const storedComplaints = localStorage.getItem('sgp_complaints');
        const storedLogs = localStorage.getItem('sgp_logs');
        const storedNotifs = localStorage.getItem('sgp_notifs');
        const hasReset = localStorage.getItem('sgp_reset_v3');

        if (hasReset && storedComplaints && storedLogs && storedNotifs) {
          const parsedComplaints: Complaint[] = JSON.parse(storedComplaints);
          const parsedLogs: ActivityLog[] = JSON.parse(storedLogs);
          const parsedNotifs: Notification[] = JSON.parse(storedNotifs);

          const filteredComplaints = parsedComplaints.filter(c => c.id !== 'GRV-6909' && c.id !== 'GRV-3331');
          const filteredLogs = parsedLogs.filter(l => l.complaintId !== 'GRV-6909' && l.complaintId !== 'GRV-3331');
          const filteredNotifs = parsedNotifs.filter(n => n.complaintId !== 'GRV-6909' && n.complaintId !== 'GRV-3331');

          setComplaints(filteredComplaints);
          setActivityLogs(filteredLogs);
          setNotifications(filteredNotifs);

          localStorage.setItem('sgp_complaints', JSON.stringify(filteredComplaints));
          localStorage.setItem('sgp_logs', JSON.stringify(filteredLogs));
          localStorage.setItem('sgp_notifs', JSON.stringify(filteredNotifs));
        } else {
          localStorage.setItem('sgp_reset_v3', 'true');
          setComplaints([]);
          setActivityLogs([]);
          setNotifications([]);
          localStorage.setItem('sgp_complaints', JSON.stringify([]));
          localStorage.setItem('sgp_logs', JSON.stringify([]));
          localStorage.setItem('sgp_notifs', JSON.stringify([]));
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  // 7-Second Device-to-Device Synchronization Loop
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      syncWithBackend();
    }, 7000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Save changes locally (SGP Local Sandbox cache)
  const syncStorage = (newComplaints: Complaint[], newLogs: ActivityLog[], newNotifs: Notification[]) => {
    setComplaints(newComplaints);
    setActivityLogs(newLogs);
    setNotifications(newNotifs);
    localStorage.setItem('sgp_complaints', JSON.stringify(newComplaints));
    localStorage.setItem('sgp_logs', JSON.stringify(newLogs));
    localStorage.setItem('sgp_notifs', JSON.stringify(newNotifs));
  };

  // Auto-escalation checks
  useEffect(() => {
    if (!isLoaded || complaints.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      let changed = false;
      const extraLogs: ActivityLog[] = [];
      const extraNotifs: Notification[] = [];

      const updatedComplaints = complaints.map(c => {
        if (
          c.status !== 'Submitted' &&
          (c.status === 'Seen' || c.status === 'In Progress') &&
          c.escalationTimerEnds !== 'pending' &&
          new Date(c.escalationTimerEnds) <= now
        ) {
          changed = true;
          
          const logId = 'log-esc-' + Math.random().toString(36).substr(2, 9);
          const newLog: ActivityLog = {
            id: logId,
            complaintId: c.id,
            complaintTitle: c.title,
            userRole: 'admin',
            userName: 'System SLA Bot',
            action: 'Escalated',
            details: `Complaint ${c.id} auto-escalated after SLA timeout.`,
            timestamp: now.toISOString()
          };

          const notifId = 'notif-esc-' + Math.random().toString(36).substr(2, 9);
          const newNotif: Notification = {
            id: notifId,
            recipientRole: 'admin',
            title: `Critical Escalation: ${c.id}`,
            message: `Complaint ${c.id} regarding "${c.title}" auto-escalated to Administration due to SLA breach.`,
            read: false,
            complaintId: c.id,
            timestamp: now.toISOString()
          };

          // Trigger backend update for escalation
          fetch(`${BACKEND_URL}/api/complaints/${c.id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: 'Escalated', userName: 'System SLA Bot', userRole: 'admin' })
          }).catch(() => console.warn('Escalation backend sync missed.'));

          extraLogs.push(newLog);
          extraNotifs.push(newNotif);

          return {
            ...c,
            status: 'Escalated' as ComplaintStatus,
            updatedAt: now.toISOString()
          };
        }
        return c;
      });

      if (changed) {
        setComplaints(updatedComplaints);
        setActivityLogs(prev => [...extraLogs, ...prev]);
        setNotifications(prev => [...extraNotifs, ...prev]);
        
        localStorage.setItem('sgp_complaints', JSON.stringify(updatedComplaints));
        localStorage.setItem('sgp_logs', JSON.stringify([...extraLogs, ...activityLogs]));
        localStorage.setItem('sgp_notifs', JSON.stringify([...extraNotifs, ...notifications]));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isLoaded, complaints, activityLogs, notifications]);

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    const lowercaseEmail = email.toLowerCase().trim();

    // 1. Strict Institutional Domain Validation
    if (!lowercaseEmail.endsWith('.edu')) {
      return { 
        success: false, 
        error: 'ACCESS DENIED: Unauthorized domain. Only official institutional (.edu) email addresses are permitted in this protected ecosystem.' 
      };
    }

    const matchedUser = DEMO_USERS.find(u => u.email === lowercaseEmail);
    // Support both standard password123 and original credential files as safe local emulator fallbacks
    const isOfflinePasswordValid = password === 'password123' ||
      (lowercaseEmail === 'sonal@student.edu' && password === 'Sonal@123') ||
      (lowercaseEmail === 'kumkum@student.edu' && password === 'Kumkum@123') ||
      (lowercaseEmail === 'roshan@student.edu' && password === 'Roshan@123') ||
      (lowercaseEmail === 'academics@teacher.edu' && password === 'Kashif@123') ||
      (lowercaseEmail === 'maintenance@teacher.edu' && password === 'Maintain@123') ||
      (lowercaseEmail === 'grievance@teacher.edu' && password === 'Grievance@123') ||
      (lowercaseEmail === 'hod@college.edu' && password === 'Hod@123') ||
      (lowercaseEmail === 'admin@college.edu' && password === 'Admin@123');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lowercaseEmail, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('sgp_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('sgp_token', data.token);
        }
        // Immediately sync data with token
        await syncWithBackend();
        return { success: true, role: data.user.role };
      } else {
        if (matchedUser && isOfflinePasswordValid) {
          console.warn('Backend authentication failed. Using offline sandbox cache.');
          setCurrentUser(matchedUser);
          localStorage.setItem('sgp_user', JSON.stringify(matchedUser));
          return { success: true, role: matchedUser.role };
        }
        return { success: false, error: data.error || 'Authentication failed.' };
      }
    } catch (err) {
      console.warn('Backend API unavailable. Falling back to local offline session.');
      if (!matchedUser) {
        return { success: false, error: 'User account not registered in university database.' };
      }
      if (!isOfflinePasswordValid) {
        return { success: false, error: 'Incorrect portal credentials. Please check password.' };
      }
      setCurrentUser(matchedUser);
      localStorage.setItem('sgp_user', JSON.stringify(matchedUser));
      return { success: true, role: matchedUser.role };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sgp_user');
    localStorage.removeItem('sgp_token');
  };

  // Submit new complaint
  const createComplaint = async (
    title: string,
    description: string,
    category: 'Lecturer / ERP / Marks' | 'Maintenance' | 'Harassment',
    anonymous: boolean,
    protectedIdentity: boolean,
    priority: 'Low' | 'Medium' | 'High' | 'Critical',
    attachments?: string[]
  ) => {
    if (!currentUser) return;

    const now = new Date();
    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const complaintId = `GRV-${uniqueNum}`;
    const assignment = getAssignmentForCategory(category);
    
    let slaHours = 24;
    if (priority === 'Low') {
      // 3 minutes for Low
      slaHours = isFastSlaMode ? (3 / 60) : 48;
    } else if (priority === 'Medium') {
      // 90 seconds for Medium (Perfect for 24h testing!)
      slaHours = isFastSlaMode ? (1.5 / 60) : 24;
    } else if (priority === 'High') {
      // 45 seconds for High
      slaHours = isFastSlaMode ? (0.75 / 60) : 12;
    } else if (priority === 'Critical') {
      // 20 seconds for Critical
      slaHours = isFastSlaMode ? (0.33 / 60) : 6;
    }
    
    const escalationEnds = new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString();

    const newComplaint: Complaint = {
      id: complaintId,
      title,
      description,
      category,
      status: 'Submitted',
      anonymous,
      protectedIdentity,
      priority,
      studentId: currentUser.id,
      studentName: anonymous ? 'Anonymous Student' : currentUser.name,
      studentEmail: anonymous ? 'anonymous@student.edu' : currentUser.email,
      assignedTeacherId: assignment.teacherId,
      assignedTeacherName: assignment.teacherName,
      supportCount: 0,
      supportedBy: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      escalationTimerEnds: 'pending',
      reopenedCount: 0,
      attachments: attachments || []
    };

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: title,
      userRole: currentUser.role,
      userName: anonymous ? 'Anonymous Student' : currentUser.name,
      action: 'Submitted',
      details: `Complaint registered in "${category}" assigned to ${assignment.teacherName}.`,
      timestamp: now.toISOString()
    };

    const teacherNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientId: assignment.teacherId,
      recipientRole: 'teacher',
      title: 'New Complaint Assigned',
      message: `A new ${category} complaint has been submitted: "${title}"`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

    const adminNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientRole: 'admin',
      title: 'New Grievance Registered',
      message: `"${title}" has been registered by ${anonymous ? 'Anonymous' : currentUser.name}`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

     // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title, description, category, priority, anonymous,
          protectedIdentity, studentId: currentUser.id, studentName: currentUser.name, studentEmail: currentUser.email,
          teacherId: assignment.teacherId, teacherName: assignment.teacherName
        })
      });
    } catch (err) {
      console.warn('Failed to sync new complaint with backend database');
    }

    syncStorage([newComplaint, ...complaints], [newLog, ...activityLogs], [teacherNotif, adminNotif, ...notifications]);
  };

  // Update Priority
  const updateComplaintPriority = async (complaintId: string, priority: 'Low' | 'Medium' | 'High' | 'Critical') => {
    if (!currentUser) return;
    const now = new Date();

    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        let slaHours = 24;
        if (priority === 'Low') slaHours = 48;
        else if (priority === 'Medium') slaHours = 24;
        else if (priority === 'High') slaHours = 12;
        else if (priority === 'Critical') slaHours = 6;
        
        const createdAtTime = new Date(c.createdAt).getTime();
        const newEscalationEnds = new Date(createdAtTime + slaHours * 60 * 60 * 1000).toISOString();

        return {
          ...c,
          priority,
          escalationTimerEnds: newEscalationEnds,
          updatedAt: now.toISOString()
        };
      }
      return c;
    });

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: complaints.find(c => c.id === complaintId)?.title || 'Unknown',
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Priority Updated',
      details: `Complaint priority escalated/changed to ${priority}.`,
      timestamp: now.toISOString()
    };

    syncStorage(updatedComplaints, [newLog, ...activityLogs], notifications);
  };

  // Update Status
  const updateComplaintStatus = async (complaintId: string, status: ComplaintStatus) => {
    if (!currentUser) return;
    const now = new Date();

    const targetComplaint = complaints.find(c => c.id === complaintId);
    if (!targetComplaint) return;

    const oldStatus = targetComplaint.status;

    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        const updateFields: Partial<Complaint> = {
          status,
          updatedAt: now.toISOString()
        };

        if (status === 'Seen') {
          let slaHours = 24;
          if (c.priority === 'Low') slaHours = isFastSlaMode ? (3 / 60) : 48;
          else if (c.priority === 'Medium') slaHours = isFastSlaMode ? (1.5 / 60) : 24;
          else if (c.priority === 'High') slaHours = isFastSlaMode ? (0.75 / 60) : 12;
          else if (c.priority === 'Critical') slaHours = isFastSlaMode ? (0.33 / 60) : 6;

          const escalationEnds = new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString();
          updateFields.escalationTimerEnds = escalationEnds;
        }

        return {
          ...c,
          ...updateFields
        };
      }
      return c;
    });

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: targetComplaint.title,
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Status Updated',
      details: `Status updated from "${oldStatus}" to "${status}".`,
      timestamp: now.toISOString()
    };

    const studentNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientId: targetComplaint.studentId,
      title: `Grievance Updated: ${complaintId}`,
      message: `Your complaint status was updated to "${status}" by ${currentUser.name}.`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

    // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status,
          userName: currentUser.name,
          userRole: currentUser.role,
          priority: targetComplaint.priority,
          isFastSlaMode
        })
      });
    } catch (err) {
      console.warn('Failed to sync status update with backend database');
    }

    syncStorage(updatedComplaints, [newLog, ...activityLogs], [studentNotif, ...notifications]);
  };

  // Resolve complaint
  const resolveComplaint = async (complaintId: string, resolutionDetails: string, resolutionRemarks: string) => {
    if (!currentUser) return;
    const now = new Date();

    const targetComplaint = complaints.find(c => c.id === complaintId);
    if (!targetComplaint) return;

    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'Pending HOD Verification' as ComplaintStatus,
          isFrozen: true,
          updatedAt: now.toISOString(),
          resolvedAt: now.toISOString(),
          resolvedBy: currentUser.name,
          resolutionDetails,
          resolutionRemarks
        };
      }
      return c;
    });

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: targetComplaint.title,
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Resolved & Submitted',
      details: `Resolution submitted by ${currentUser.name}. Awaiting HOD verification approval. Actions taken: "${resolutionDetails.substring(0, 80)}..."`,
      timestamp: now.toISOString()
    };

    const hodNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientRole: 'hod',
      title: `Verification Request: ${complaintId}`,
      message: `Faculty resolved "${targetComplaint.title}". Audit verification is required before closure.`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

    // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints/${complaintId}/resolve`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ resolutionDetails, resolutionRemarks, resolvedBy: currentUser.name, status: 'Pending HOD Verification' })
      });
    } catch (err) {
      console.warn('Failed to sync resolution with backend database');
    }

    syncStorage(updatedComplaints, [newLog, ...activityLogs], [hodNotif, ...notifications]);
  };

  // Reopen resolved complaint
  const reopenComplaint = async (complaintId: string, reason: string) => {
    if (!currentUser) return;
    const now = new Date();
    const escalationEnds = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const targetComplaint = complaints.find(c => c.id === complaintId);
    if (!targetComplaint) return;

    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'In Progress' as ComplaintStatus,
          reopenedCount: c.reopenedCount + 1,
          updatedAt: now.toISOString(),
          escalationTimerEnds: escalationEnds,
          resolvedAt: undefined,
          resolvedBy: undefined
        };
      }
      return c;
    });

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: targetComplaint.title,
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Reopened',
      details: `Grievance reopened by student. Reason: "${reason}"`,
      timestamp: now.toISOString()
    };

    const teacherNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientId: targetComplaint.assignedTeacherId,
      recipientRole: 'teacher',
      title: `ALERT: Complaint Reopened ${complaintId}`,
      message: `Student reopened "${targetComplaint.title}". Reason: ${reason}`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

    // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints/${complaintId}/reopen`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason, studentName: currentUser.name })
      });
    } catch (err) {
      console.warn('Failed to sync reopen action with backend database');
    }

    syncStorage(updatedComplaints, [newLog, ...activityLogs], [teacherNotif, ...notifications]);
  };

  // Rate and close complaint
  const rateComplaintResolution = async (complaintId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    const now = new Date();

    const targetComplaint = complaints.find(c => c.id === complaintId);
    if (!targetComplaint) return;

    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'Closed' as ComplaintStatus,
          feedbackRating: rating,
          feedbackComment: comment,
          updatedAt: now.toISOString()
        };
      }
      return c;
    });

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: targetComplaint.title,
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Status Updated',
      details: `Accepted resolution and rated ${rating} Stars. Status changed to Closed.`,
      timestamp: now.toISOString()
    };

    const teacherNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientId: targetComplaint.assignedTeacherId,
      title: `Feedback Received: ${complaintId}`,
      message: `Student rated your resolution as ${rating}/5 Stars.`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

    // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints/${complaintId}/rate`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ rating, comment, studentName: currentUser.name })
      });
    } catch (err) {
      console.warn('Failed to sync rating with backend database');
    }

    syncStorage(updatedComplaints, [newLog, ...activityLogs], [teacherNotif, ...notifications]);
  };

  // Support / Upvote public complaints
  const supportComplaint = async (complaintId: string) => {
    if (!currentUser) return;
    const now = new Date();

    const targetComplaint = complaints.find(c => c.id === complaintId);
    if (!targetComplaint) return;

    if (targetComplaint.studentId === currentUser.id) return;
    if (targetComplaint.anonymous) return;
    if (targetComplaint.protectedIdentity) return;
    
    const currentSupportedBy = targetComplaint.supportedBy || [];
    if (currentSupportedBy.includes(currentUser.id)) return;

    const newSupportCount = (targetComplaint.supportCount || 0) + 1;
    const newSupportedBy = [...currentSupportedBy, currentUser.id];
    
    let updatedPriority = targetComplaint.priority || 'Medium';
    const extraLogs: ActivityLog[] = [];
    const extraNotifs: Notification[] = [];

    if (newSupportCount >= 25) {
      updatedPriority = 'Critical';
      extraLogs.push({
        id: `log-tr-${Date.now()}-25`,
        complaintId,
        complaintTitle: targetComplaint.title,
        userRole: 'admin',
        userName: 'System SLA Bot',
        action: 'Severity Escalated',
        details: 'Complaint marked as Campus-Wide Concern due to 25+ community supports. Priority auto-upgraded to Critical.',
        timestamp: now.toISOString()
      });
      extraNotifs.push({
        id: `notif-tr-${Date.now()}-25-a`,
        recipientRole: 'admin',
        title: `Campus-Wide Concern: ${complaintId}`,
        message: `High Community Alert: "${targetComplaint.title}" has reached 25+ supports. Priority upgraded to Critical.`,
        read: false,
        complaintId,
        timestamp: now.toISOString()
      });
      extraNotifs.push({
        id: `notif-tr-${Date.now()}-25-h`,
        recipientRole: 'hod',
        title: `Campus-Wide Concern: ${complaintId}`,
        message: `High Community Alert: "${targetComplaint.title}" has reached 25+ supports. Priority upgraded to Critical.`,
        read: false,
        complaintId,
        timestamp: now.toISOString()
      });
    } else if (newSupportCount >= 10) {
      updatedPriority = 'High';
      extraLogs.push({
        id: `log-tr-${Date.now()}-10`,
        complaintId,
        complaintTitle: targetComplaint.title,
        userRole: 'admin',
        userName: 'System SLA Bot',
        action: 'Severity Escalated',
        details: 'Complaint marked as Trending Issue due to 10+ community supports. Priority auto-upgraded to High.',
        timestamp: now.toISOString()
      });
      extraNotifs.push({
        id: `notif-tr-${Date.now()}-10-h`,
        recipientRole: 'hod',
        title: `Trending Issue: ${complaintId}`,
        message: `Community Concern: "${targetComplaint.title}" has reached 10+ supports. Priority upgraded to High.`,
        read: false,
        complaintId,
        timestamp: now.toISOString()
      });
    }

    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          supportCount: newSupportCount,
          supportedBy: newSupportedBy,
          priority: updatedPriority,
          updatedAt: now.toISOString()
        };
      }
      return c;
    });

    const newLog: ActivityLog = {
      id: `log-sup-${Date.now()}`,
      complaintId,
      complaintTitle: targetComplaint.title,
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Upvoted',
      details: `${currentUser.name} supported this public complaint. Total supports: ${newSupportCount}.`,
      timestamp: now.toISOString()
    };

    // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints/${complaintId}/support`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ studentId: currentUser.id, studentName: currentUser.name })
      });
    } catch (err) {
      console.warn('Failed to sync upvote with backend database');
    }

    syncStorage(
      updatedComplaints, 
      [newLog, ...extraLogs, ...activityLogs], 
      [...extraNotifs, ...notifications]
    );
  };

  // Reassign complaint
  const reassignComplaint = async (complaintId: string, teacherId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const now = new Date();

    const targetComplaint = complaints.find(c => c.id === complaintId);
    const targetTeacher = DEMO_USERS.find(u => u.id === teacherId);
    if (!targetComplaint || !targetTeacher) return;

    const oldTeacher = targetComplaint.assignedTeacherName;

    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          assignedTeacherId: teacherId,
          assignedTeacherName: targetTeacher.name,
          updatedAt: now.toISOString()
        };
      }
      return c;
    });

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: targetComplaint.title,
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Reassigned',
      details: `Admin reassigned case from "${oldTeacher}" to "${targetTeacher.name}".`,
      timestamp: now.toISOString()
    };

    const oldTeacherNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientId: targetComplaint.assignedTeacherId,
      title: `Case Unassigned: ${complaintId}`,
      message: `Administrative reassignment has moved case "${targetComplaint.title}" away from your queue.`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

    const newTeacherNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      recipientId: teacherId,
      title: `Urgent Reassigned Case: ${complaintId}`,
      message: `Admin has assigned case "${targetComplaint.title}" to you. Please review priority.`,
      read: false,
      complaintId,
      timestamp: now.toISOString()
    };

    // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints/${complaintId}/reassign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          teacherId,
          teacherName: targetTeacher.name,
          userName: currentUser.name,
          userRole: currentUser.role
        })
      });
    } catch (err) {
      console.warn('Failed to sync reassignment with backend database');
    }

    syncStorage(updatedComplaints, [newLog, ...activityLogs], [oldTeacherNotif, newTeacherNotif, ...notifications]);
  };

  // Delete complaint
  const deleteComplaint = async (complaintId: string) => {
    if (!currentUser) return;
    const now = new Date();

    const targetComplaint = complaints.find(c => c.id === complaintId);
    if (!targetComplaint) return;

    const updatedComplaints = complaints.filter(c => c.id !== complaintId);

    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: targetComplaint.title,
      userRole: currentUser.role,
      userName: currentUser.name,
      action: 'Deleted',
      details: `User deleted case "${targetComplaint.title}" permanently from database.`,
      timestamp: now.toISOString()
    };

    // REST Sync Action
    try {
      await fetch(`${BACKEND_URL}/api/complaints/${complaintId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (err) {
      console.warn('Failed to sync deletion with backend database');
    }

    syncStorage(updatedComplaints, [newLog, ...activityLogs], notifications);
  };

  // Generic field updates
  const updateComplaintFields = (complaintId: string, fields: Partial<Complaint>) => {
    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          ...fields,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    syncStorage(updatedComplaints, activityLogs, notifications);
  };

  const addActivityLog = (complaintId: string, action: string, details: string) => {
    if (!currentUser) return;
    const target = complaints.find(c => c.id === complaintId);
    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      complaintTitle: target ? target.title : 'General Case',
      userRole: currentUser.role,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    syncStorage(complaints, [newLog, ...activityLogs], notifications);
  };

  // Notification management
  const dismissNotification = async (id: string) => {
    const rawId = id.replace('notif-', '');
    const updatedNotifs = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updatedNotifs);
    localStorage.setItem('sgp_notifs', JSON.stringify(updatedNotifs));

    try {
      await fetch(`${BACKEND_URL}/api/notifications/${rawId}/read`, {
        method: 'PUT',
        headers: getHeaders()
      });
    } catch (err) {
      console.warn('Failed to sync notification read state');
    }
  };

  const clearAllNotifications = () => {
    const updatedNotifs = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifs);
    localStorage.setItem('sgp_notifs', JSON.stringify(updatedNotifs));
  };

  return (
    <PortalContext.Provider
      value={{
        currentUser,
        complaints,
        activityLogs,
        notifications,
        login,
        logout,
        createComplaint,
        updateComplaintPriority,
        updateComplaintStatus,
        resolveComplaint,
        reopenComplaint,
        rateComplaintResolution,
        supportComplaint,
        reassignComplaint,
        deleteComplaint,
        updateComplaintFields,
        addActivityLog,
        dismissNotification,
        clearAllNotifications,
        isFastSlaMode,
        toggleFastSlaMode
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};
