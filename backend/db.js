const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0
};

const DB_NAME = process.env.DB_NAME || 'grievance_portal';
const JSON_DB_PATH = path.join(__dirname, 'database.json');

const hashedPass = bcrypt.hashSync('password123', 10);

// --- Seed Data for SQL Emulator ---
const SEED_USERS = [
  { id: 'usr-s1', email: 'sonal@student.edu', password: hashedPass, name: 'Sonal Tripathi', role: 'student', department: null, avatar: 'ST' },
  { id: 'usr-s2', email: 'kumkum@student.edu', password: hashedPass, name: 'Kumkum Sen', role: 'student', department: null, avatar: 'KS' },
  { id: 'usr-s3', email: 'roshan@student.edu', password: hashedPass, name: 'Roshan Kumar', role: 'student', department: null, avatar: 'RK' },
  { id: 'usr-t1', email: 'academics@teacher.edu', password: hashedPass, name: 'Prof. Kashif Sheikh', role: 'teacher', department: 'Lecturer / ERP / Marks', avatar: 'KS' },
  { id: 'usr-t2', email: 'maintenance@teacher.edu', password: hashedPass, name: 'Maintenance Team', role: 'teacher', department: 'Maintenance', avatar: 'MT' },
  { id: 'usr-t3', email: 'grievance@teacher.edu', password: hashedPass, name: 'Grievance Team', role: 'teacher', department: 'Harassment', avatar: 'GT' },
  { id: 'usr-h1', email: 'hod@college.edu', password: hashedPass, name: 'Dr. Anand Verma (HOD)', role: 'hod', department: null, avatar: 'AV' },
  { id: 'usr-a1', email: 'admin@college.edu', password: hashedPass, name: 'Director Sarah (Admin)', role: 'admin', department: null, avatar: 'DS' }
];

// Load or Initialize JSON database
function loadJsonDatabase() {
  if (!fs.existsSync(JSON_DB_PATH)) {
    const initialDb = {
      users: SEED_USERS,
      complaints: [],
      activity_logs: [],
      notifications: [],
      supported_complaints: []
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
  try {
    const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf8'));
    data.users = SEED_USERS;
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return data;
  } catch (err) {
    console.error('⚠️ JSON Database read failed, recreating...', err.message);
    const initialDb = {
      users: SEED_USERS,
      complaints: [],
      activity_logs: [],
      notifications: [],
      supported_complaints: []
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
}

function saveJsonDatabase(data) {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ JSON Database save failed', err.message);
  }
}

// Emulated Promise Pool object
const emulatedPool = {
  query: async function(sql, params = []) {
    const dbData = loadJsonDatabase();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. SELECT * FROM users WHERE email = ?
    if (/SELECT \* FROM users WHERE email = \?/i.test(cleanSql)) {
      const email = params[0]?.toLowerCase().trim();
      const matched = dbData.users.filter(u => u.email === email);
      return [matched, []];
    }

    // 2. SELECT * FROM complaints ORDER BY created_at DESC
    if (/SELECT \* FROM complaints/i.test(cleanSql)) {
      // Sort by created_at desc
      const sorted = [...dbData.complaints].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return [sorted, []];
    }

    // 3. SELECT * FROM activity_logs ORDER BY timestamp DESC
    if (/SELECT \* FROM activity_logs/i.test(cleanSql)) {
      const sorted = [...dbData.activity_logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return [sorted, []];
    }

    // 4. SELECT * FROM notifications ORDER BY timestamp DESC
    if (/SELECT \* FROM notifications/i.test(cleanSql)) {
      const sorted = [...dbData.notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return [sorted, []];
    }

    // 5. INSERT INTO complaints
    if (/INSERT INTO complaints/i.test(cleanSql)) {
      const [
        id, title, description, category, anonymous, protected_identity, 
        student_id, student_name, student_email, assigned_teacher_id, assigned_teacher_name, 
        escalation_timer_ends
      ] = [
        params[0], params[1], params[2], params[3], params[4], params[5],
        params[6], params[7], params[8], params[9], params[10], params[11]
      ];

      const newComplaint = {
        id,
        title,
        description,
        category,
        status: 'Submitted',
        anonymous: anonymous === 1 || anonymous === true,
        protected_identity: protected_identity === 1 || protected_identity === true,
        student_id,
        student_name,
        student_email,
        assigned_teacher_id,
        assigned_teacher_name,
        support_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        escalation_timer_ends: new Date(escalation_timer_ends).toISOString(),
        resolved_at: null,
        resolved_by: null,
        resolution_details: null,
        resolution_remarks: null,
        feedback_rating: null,
        feedback_comment: null,
        reopened_count: 0,
        attachments: null,
        // Supervision / operational custom fields initialized in emulator
        priority: 'Medium',
        is_emergency: false,
        rapid_response_assigned: false,
        is_frozen: false,
        hod_notes: null,
        warnings: null,
        clarification_requests: null,
        disciplinary_actions: null,
        resolution_overrides: null,
        escalated_to_admin: false,
        escalation_reason: null,
        escalation_severity: null,
        escalation_urgency_notes: null
      };

      dbData.complaints.push(newComplaint);
      saveJsonDatabase(dbData);
      return [{ affectedRows: 1 }, []];
    }

    // 6. INSERT INTO activity_logs
    if (/INSERT INTO activity_logs/i.test(cleanSql)) {
      const [complaint_id, complaint_title, user_role, user_name, action, details] = params;
      const newLog = {
        id: dbData.activity_logs.length + 1,
        complaint_id,
        complaint_title,
        user_role,
        user_name,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      dbData.activity_logs.push(newLog);
      saveJsonDatabase(dbData);
      return [{ affectedRows: 1 }, []];
    }

    // 7. INSERT INTO notifications
    if (/INSERT INTO notifications/i.test(cleanSql)) {
      const [recipient_role, recipient_id, title, message, complaint_id] = params;
      const newNotif = {
        id: dbData.notifications.length + 1,
        recipient_role,
        recipient_id,
        title,
        message,
        is_read: false,
        complaint_id,
        timestamp: new Date().toISOString()
      };
      dbData.notifications.push(newNotif);
      saveJsonDatabase(dbData);
      return [{ affectedRows: 1 }, []];
    }

    // 8. UPDATE complaints SET status = 'Resolved'
    if (/UPDATE complaints SET status = 'Resolved'/i.test(cleanSql)) {
      const [resolved_at, resolved_by, resolution_details, resolution_remarks, id] = params;
      const idx = dbData.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        dbData.complaints[idx].status = 'Resolved';
        dbData.complaints[idx].resolved_at = new Date(resolved_at).toISOString();
        dbData.complaints[idx].resolved_by = resolved_by;
        dbData.complaints[idx].resolution_details = resolution_details;
        dbData.complaints[idx].resolution_remarks = resolution_remarks;
        dbData.complaints[idx].updated_at = new Date().toISOString();
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 9. UPDATE complaints SET status = 'In Progress' (Reopen)
    if (/UPDATE complaints SET status = 'In Progress'/i.test(cleanSql)) {
      const [escalation_timer_ends, id] = params;
      const idx = dbData.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        dbData.complaints[idx].status = 'In Progress';
        dbData.complaints[idx].escalation_timer_ends = new Date(escalation_timer_ends).toISOString();
        dbData.complaints[idx].reopened_count += 1;
        dbData.complaints[idx].resolved_at = null;
        dbData.complaints[idx].resolved_by = null;
        dbData.complaints[idx].updated_at = new Date().toISOString();
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 10. UPDATE complaints SET status = ? (Status transition e.g. Seen, Escalated)
    if (/UPDATE complaints SET status = \?, assigned_teacher_id = \?, assigned_teacher_name = \?/i.test(cleanSql)) {
      const [status, teacher_id, teacher_name, id] = params;
      const idx = dbData.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        dbData.complaints[idx].status = status;
        dbData.complaints[idx].assigned_teacher_id = teacher_id;
        dbData.complaints[idx].assigned_teacher_name = teacher_name;
        dbData.complaints[idx].updated_at = new Date().toISOString();
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 11. UPDATE complaints SET feedback_rating = ?, feedback_comment = ?, status = 'Closed'
    if (/feedback_rating = \?, feedback_comment = \?, status = 'Closed'/i.test(cleanSql)) {
      const [rating, comment, id] = params;
      const idx = dbData.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        dbData.complaints[idx].status = 'Closed';
        dbData.complaints[idx].feedback_rating = rating;
        dbData.complaints[idx].feedback_comment = comment;
        dbData.complaints[idx].updated_at = new Date().toISOString();
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 11.5 UPDATE complaints SET status = ?, escalation_timer_ends = ? WHERE id = ?
    if (/UPDATE complaints SET status = \?, escalation_timer_ends = \? WHERE id = \?/i.test(cleanSql)) {
      const [status, escalation_timer_ends, id] = params;
      const idx = dbData.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        dbData.complaints[idx].status = status;
        dbData.complaints[idx].escalation_timer_ends = new Date(escalation_timer_ends).toISOString();
        dbData.complaints[idx].updated_at = new Date().toISOString();
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 12. UPDATE complaints SET status = ? WHERE id = ? (Direct status update)
    if (/UPDATE complaints SET status = \? WHERE id = \?/i.test(cleanSql)) {
      const [status, id] = params;
      const idx = dbData.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        dbData.complaints[idx].status = status;
        dbData.complaints[idx].updated_at = new Date().toISOString();
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 12.5 Dynamic update query on complaints table
    if (/UPDATE complaints SET/i.test(cleanSql) && /WHERE id = \?/i.test(cleanSql)) {
      const id = params[params.length - 1];
      const idx = dbData.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        const setPart = cleanSql.match(/SET (.+) WHERE/i)?.[1];
        if (setPart) {
          const fields = setPart.split(',').map(f => f.trim().split(' ')[0].replace(/`/g, ''));
          fields.forEach((field, i) => {
            const val = params[i];
            
            // Map snake_case database columns to camelCase JS properties if necessary
            let key = field;
            if (field === 'assigned_teacher_id') key = 'assignedTeacherId';
            else if (field === 'assigned_teacher_name') key = 'assignedTeacherName';
            else if (field === 'escalation_timer_ends') key = 'escalationTimerEnds';
            else if (field === 'resolved_at') key = 'resolvedAt';
            else if (field === 'resolved_by') key = 'resolvedBy';
            else if (field === 'resolution_details') key = 'resolutionDetails';
            else if (field === 'resolution_remarks') key = 'resolutionRemarks';
            else if (field === 'feedback_rating') key = 'feedbackRating';
            else if (field === 'feedback_comment') key = 'feedbackComment';
            else if (field === 'reopened_count') key = 'reopenedCount';
            else if (field === 'protected_identity') key = 'protectedIdentity';
            else if (field === 'is_emergency') key = 'isEmergency';
            else if (field === 'rapid_response_assigned') key = 'rapidResponseAssigned';
            else if (field === 'is_frozen') key = 'isFrozen';
            else if (field === 'hod_notes') key = 'hodNotes';
            else if (field === 'escalated_to_admin') key = 'escalatedToAdmin';
            else if (field === 'escalation_reason') key = 'escalationReason';
            else if (field === 'escalation_severity') key = 'escalationSeverity';
            else if (field === 'escalation_urgency_notes') key = 'escalationUrgencyNotes';

            dbData.complaints[idx][key] = val;
            
            // Also store as database-column-name in emulator to maintain perfect SQL likeness
            dbData.complaints[idx][field] = val;
          });
          dbData.complaints[idx].updated_at = new Date().toISOString();
          saveJsonDatabase(dbData);
          return [{ affectedRows: 1 }, []];
        }
      }
      return [{ affectedRows: 0 }, []];
    }

    // 13. DELETE FROM complaints WHERE id = ?
    if (/DELETE FROM complaints WHERE id = \?/i.test(cleanSql)) {
      const id = params[0];
      const lengthBefore = dbData.complaints.length;
      dbData.complaints = dbData.complaints.filter(c => c.id !== id);
      if (dbData.complaints.length < lengthBefore) {
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 14. Support/Upvote updates
    if (/INSERT INTO supported_complaints/i.test(cleanSql)) {
      const [complaint_id, student_id] = params;
      const exists = dbData.supported_complaints.some(sc => sc.complaint_id === complaint_id && sc.student_id === student_id);
      if (!exists) {
        dbData.supported_complaints.push({ complaint_id, student_id, timestamp: new Date().toISOString() });
        // Increment support count in complaints
        const idx = dbData.complaints.findIndex(c => c.id === complaint_id);
        if (idx !== -1) {
          dbData.complaints[idx].support_count += 1;
        }
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 15. SELECT * FROM supported_complaints
    if (/SELECT \* FROM supported_complaints/i.test(cleanSql)) {
      return [dbData.supported_complaints, []];
    }

    // 16. PUT /api/notifications/:id/read
    if (/UPDATE notifications SET is_read = 1 WHERE id = \?/i.test(cleanSql)) {
      const id = parseInt(params[0]);
      const idx = dbData.notifications.findIndex(n => n.id === id);
      if (idx !== -1) {
        dbData.notifications[idx].is_read = true;
        saveJsonDatabase(dbData);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    console.warn('⚠️ SQL Query Emulator: Unhandled SQL pattern', cleanSql);
    return [[], []];
  }
};

// --- Active Connection Handling ---
let activePool = null;

// 1. Setup Pool (No Database attached) used strictly for Auto-Creation
const setupPool = mysql.createPool(dbConfig);

// 2. Application Pool (Attached to Database)
const pool = mysql.createPool({
  ...dbConfig,
  database: DB_NAME
});

const promisePool = pool.promise();

// Connection Diagnostics and Auto Setup
async function initializeDatabase() {
  try {
    // Attempt to automatically create the database if it is missing
    await setupPool.promise().query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    
    // Test the actual connection pool
    const connection = await promisePool.getConnection();
    console.log('✅ MySQL Database Connected Successfully (XAMPP/Live)');
    
    // Run schema alterations
    try {
      console.log('🚀 Running database schema alterations (live MySQL)...');
      
      // 1. Alter status enum
      await promisePool.query(`
        ALTER TABLE complaints MODIFY COLUMN status ENUM(
          'Submitted', 'Seen', 'In Progress', 'Escalated', 'Resolved', 'Closed',
          'Pending HOD Verification', 'Returned For Rework', 'Verified & Closed'
        ) DEFAULT 'Submitted';
      `);
      
      // 2. Add dynamic operational & supervision columns if they don't exist
      const addColumns = [
        "ALTER TABLE complaints ADD COLUMN priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium';",
        "ALTER TABLE complaints ADD COLUMN is_emergency BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE complaints ADD COLUMN rapid_response_assigned BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE complaints ADD COLUMN is_frozen BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE complaints ADD COLUMN hod_notes TEXT DEFAULT NULL;",
        "ALTER TABLE complaints ADD COLUMN warnings TEXT DEFAULT NULL;",
        "ALTER TABLE complaints ADD COLUMN clarification_requests TEXT DEFAULT NULL;",
        "ALTER TABLE complaints ADD COLUMN disciplinary_actions TEXT DEFAULT NULL;",
        "ALTER TABLE complaints ADD COLUMN resolution_overrides TEXT DEFAULT NULL;",
        "ALTER TABLE complaints ADD COLUMN escalated_to_admin BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE complaints ADD COLUMN escalation_reason TEXT DEFAULT NULL;",
        "ALTER TABLE complaints ADD COLUMN escalation_severity VARCHAR(50) DEFAULT NULL;",
        "ALTER TABLE complaints ADD COLUMN escalation_urgency_notes TEXT DEFAULT NULL;"
      ];

      for (const colQuery of addColumns) {
        try {
          await promisePool.query(colQuery);
        } catch (e) {
          // Ignore error if column already exists
        }
      }
      console.log('✓ Database schema alterations complete!');
    } catch (migErr) {
      console.warn('⚠️ live MySQL schema alteration warning:', migErr.message);
    }
    
    connection.release();
    activePool = promisePool;
  } catch (err) {
    let errorMsg = err.message;
    if (err.code === 'ECONNREFUSED') {
      errorMsg = 'MySQL Service Not Running (ECONNREFUSED)';
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMsg = 'Database Authentication Failed (Access denied for user)';
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      errorMsg = 'Database Missing (Could not auto-create)';
    }

    console.error(`❌ ${errorMsg}`);
    console.log('💡 Starting Local zero-setup SQL Database Emulator (backend/database.json)...');
    loadJsonDatabase(); // Seed if not present
    activePool = emulatedPool;
    console.log('✅ SQLite/JSON Database Emulation Active (Zero-Setup Core Online)');
  }
}

initializeDatabase();

// Export a proxy object that routes queries to whichever pool is active
const poolProxy = {
  query: async (sql, params) => {
    // Wait slightly if initialization is pending
    if (!activePool) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return activePool.query(sql, params);
  }
};

module.exports = poolProxy;
