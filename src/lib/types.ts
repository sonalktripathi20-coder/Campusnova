export type UserRole = 'admin' | 'hod' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string; // For teachers: 'Lecturer / ERP / Marks' | 'Maintenance' | 'Harassment'
  avatar?: string;
}

export type ComplaintStatus = 'Submitted' | 'Seen' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed' | 'Pending HOD Verification' | 'Returned For Rework' | 'Verified & Closed';

export interface Complaint {
  id: string; // e.g., GRV-1002
  title: string;
  description: string;
  category: 'Lecturer / ERP / Marks' | 'Maintenance' | 'Harassment';
  status: ComplaintStatus;
  anonymous: boolean;
  protectedIdentity: boolean;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  
  // Student info (redacted for HOD)
  studentId: string;
  studentName: string;
  studentEmail: string;
  
  // Assignment details
  assignedTeacherId: string;
  assignedTeacherName: string;
  
  // Support & Activity
  supportCount: number;
  supportedBy: string[]; // User IDs who upvoted
  createdAt: string;
  updatedAt: string;
  
  // Escalation & SLA Timer
  escalationTimerEnds: string; // ISO string 24h from submission or reopen
  
  // Custom operational states for realistic HOD & Admin authority
  escalatedToAdmin?: boolean;
  escalationReason?: string;
  escalationSeverity?: string;
  escalationUrgencyNotes?: string;
  
  isFrozen?: boolean;
  hodNotes?: string;
  
  isEmergency?: boolean;
  rapidResponseAssigned?: boolean;
  
  warnings?: Array<{
    id: string;
    reason: string;
    remark: string;
    extension?: string;
    timestamp: string;
  }>;
  
  clarificationRequests?: Array<{
    id: string;
    query: string;
    reply?: string;
    timestamp: string;
  }>;
  
  disciplinaryActions?: Array<{
    id: string;
    actionType: string;
    negligence: boolean;
    timestamp: string;
  }>;
  
  resolutionOverrides?: Array<{
    details: string;
    timestamp: string;
  }>;
  
  // Resolution details (mandatory for resolver)
  resolutionDetails?: string;
  resolutionRemarks?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  
  // Student Feedback & Reopening
  feedbackRating?: number; // 1 to 5 stars
  feedbackComment?: string;
  reopenedCount: number;
  
  // Attachments
  attachments?: string[]; // Array of base64 images or file names
}

export interface ActivityLog {
  id: string;
  complaintId: string;
  complaintTitle: string;
  userRole: UserRole;
  userName: string;
  action: string; // e.g., 'Submitted', 'Status Updated', 'Resolved', 'Reassigned'
  details: string; // e.g., 'Status changed from Seen to In Progress'
  timestamp: string;
}

export interface Notification {
  id: string;
  recipientRole?: UserRole; // If null, specific to recipientId
  recipientId?: string;
  title: string;
  message: string;
  read: boolean;
  complaintId: string;
  timestamp: string;
}
