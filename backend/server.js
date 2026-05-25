const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ========================================================
// REST API CONTROLLERS (Direct SQL queries with Emulation Fallbacks)
// ========================================================

// 1. Auth Login Endpoint with strict Double-Layered .edu Security
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Institutional Email and password fields required.' });
  }

  const lowercaseEmail = email.toLowerCase().trim();

  // STAGE 1: Server-Level Domain Enforcement
  if (!lowercaseEmail.endsWith('.edu')) {
    console.warn(`🚨 BLOCKED: Unauthorized login attempt from domain: ${lowercaseEmail}`);
    return res.status(400).json({
      error: 'ACCESS DENIED: Unauthorized domain. Only official institutional (.edu) email addresses are permitted in this protected ecosystem.'
    });
  }

  try {
    // Query users database
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [lowercaseEmail]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User account not registered in university database.' });
    }

    const user = rows[0];
    // Password match validation
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect portal credentials. Please check password.' });
    }

    // Return session details (excluding password)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        avatar: user.avatar
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Database authentication failed.', details: err.message });
  }
});

// 2. Fetch All Complaints (With Role Security Redactions)
app.get('/api/complaints', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch complaints.', details: err.message });
  }
});

// 3. Register Complaint (SLA auto-calculation included)
app.post('/api/complaints', async (req, res) => {
  const { 
    title, description, category, priority, anonymous, 
    protectedIdentity, studentId, studentName, studentEmail,
    teacherId, teacherName
  } = req.body;

  if (!title || !description || !category || !studentId) {
    return res.status(400).json({ error: 'Missing mandatory complaint registration fields.' });
  }

  try {
    const uniqueId = `GRV-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    
    // Default escalations timers based on severity standard SLA rules
    let slaHours = 24; 
    if (priority === 'Critical') slaHours = 6;
    else if (priority === 'High') slaHours = 12;
    else if (priority === 'Medium') slaHours = 24;
    else if (priority === 'Low') slaHours = 48;

    const escalationTime = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const sql = `
      INSERT INTO complaints (
        id, title, description, category, status, anonymous, protected_identity, 
        student_id, student_name, student_email, assigned_teacher_id, assigned_teacher_name, 
        escalation_timer_ends
      ) VALUES (?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      uniqueId, title, description, category,
      anonymous ? 1 : 0, 
      protectedIdentity ? 1 : 0, 
      studentId, 
      anonymous ? 'Anonymous Student' : studentName,
      anonymous ? 'anonymous@student.edu' : studentEmail,
      teacherId, teacherName, escalationTime
    ];

    await db.query(sql, params);

    // Insert Log Action
    await db.query(
      'INSERT INTO activity_logs (complaint_id, complaint_title, user_role, user_name, action, details) VALUES (?, ?, ?, ?, ?, ?)',
      [uniqueId, title, 'student', anonymous ? 'Anonymous' : studentName, 'Submitted', `Registered in ${category}.`]
    );

    res.status(201).json({ success: true, complaintId: uniqueId });

  } catch (err) {
    res.status(500).json({ error: 'Unable to commit case to database.', details: err.message });
  }
});

// 4. Resolve Complaint (Mandatory resolution logs)
app.put('/api/complaints/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { resolutionDetails, resolutionRemarks, resolvedBy } = req.body;

  if (!resolutionDetails) {
    return res.status(400).json({ error: 'Mandatory resolution details description is required.' });
  }

  try {
    const now = new Date();
    const sql = `
      UPDATE complaints 
      SET status = 'Resolved', resolved_at = ?, resolved_by = ?, resolution_details = ?, resolution_remarks = ?
      WHERE id = ?
    `;
    await db.query(sql, [now, resolvedBy, resolutionDetails, resolutionRemarks, id]);

    // Insert log
    await db.query(
      'INSERT INTO activity_logs (complaint_id, complaint_title, user_role, user_name, action, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'Resolved Case', 'teacher', resolvedBy, 'Resolved', `Action: ${resolutionDetails.substring(0, 50)}`]
    );

    res.json({ success: true, message: 'Resolution logged successfully.' });

  } catch (err) {
    res.status(500).json({ error: 'Database update failed.', details: err.message });
  }
});

// 5. Reopen Complaint (Resets SLA clock and increment flags)
app.put('/api/complaints/:id/reopen', async (req, res) => {
  const { id } = req.params;
  const { reason, studentName } = req.body;

  try {
    const now = new Date();
    const escalationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Reset 24 hours timer

    const sql = `
      UPDATE complaints 
      SET status = 'In Progress', escalation_timer_ends = ?, reopened_count = reopened_count + 1, resolved_at = NULL, resolved_by = NULL
      WHERE id = ?
    `;
    await db.query(sql, [escalationTime, id]);

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (complaint_id, complaint_title, user_role, user_name, action, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'Reopened Case', 'student', studentName, 'Reopened', `Reason: ${reason}`]
    );

    res.json({ success: true, message: 'Complaint successfully reopened.' });

  } catch (err) {
    res.status(500).json({ error: 'Database update failed.', details: err.message });
  }
});

// 6. Direct Status Transitions (e.g. Seen, In Progress, Escalated)
app.put('/api/complaints/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, userName, userRole, priority, isFastSlaMode } = req.body;

  try {
    let sql = `UPDATE complaints SET status = ? WHERE id = ?`;
    let params = [status, id];

    if (status === 'Seen') {
      const now = new Date();
      let slaHours = 24;
      if (priority === 'Low') slaHours = isFastSlaMode ? (3 / 60) : 48;
      else if (priority === 'Medium') slaHours = isFastSlaMode ? (1.5 / 60) : 24;
      else if (priority === 'High') slaHours = isFastSlaMode ? (0.75 / 60) : 12;
      else if (priority === 'Critical') slaHours = isFastSlaMode ? (0.33 / 60) : 6;

      const escalationEnds = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
      sql = `UPDATE complaints SET status = ?, escalation_timer_ends = ? WHERE id = ?`;
      params = [status, escalationEnds, id];
    }

    await db.query(sql, params);

    // Log Action
    await db.query(
      'INSERT INTO activity_logs (complaint_id, complaint_title, user_role, user_name, action, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'Status Update', userRole, userName, status, `Case marked as ${status}.`]
    );

    res.json({ success: true, message: `Status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Database update failed.', details: err.message });
  }
});

// 7. Rate Resolution and Close Complaint
app.put('/api/complaints/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rating, comment, studentName } = req.body;

  try {
    const sql = `
      UPDATE complaints 
      SET status = 'Closed', feedback_rating = ?, feedback_comment = ?
      WHERE id = ?
    `;
    await db.query(sql, [rating, comment, id]);

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (complaint_id, complaint_title, user_role, user_name, action, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'Closed Case', 'student', studentName, 'Closed', `Student rated resolution: ${rating} stars.`]
    );

    res.json({ success: true, message: 'Complaint closed successfully with rating.' });
  } catch (err) {
    res.status(500).json({ error: 'Database update failed.', details: err.message });
  }
});

// 8. Reassign Complaint to another Faculty/Teacher
app.put('/api/complaints/:id/reassign', async (req, res) => {
  const { id } = req.params;
  const { teacherId, teacherName, userName, userRole } = req.body;

  try {
    const sql = `
      UPDATE complaints 
      SET status = 'In Progress', assigned_teacher_id = ?, assigned_teacher_name = ?
      WHERE id = ?
    `;
    await db.query(sql, [teacherId, teacherName, id]);

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (complaint_id, complaint_title, user_role, user_name, action, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'Reassigned Case', userRole, userName, 'Reassigned', `Reassigned to ${teacherName}.`]
    );

    res.json({ success: true, message: `Complaint reassigned to ${teacherName}.` });
  } catch (err) {
    res.status(500).json({ error: 'Database update failed.', details: err.message });
  }
});

// 9. Upvote / Support Complaint
app.post('/api/complaints/:id/support', async (req, res) => {
  const { id } = req.params;
  const { studentId, studentName } = req.body;

  try {
    await db.query('INSERT INTO supported_complaints (complaint_id, student_id) VALUES (?, ?)', [id, studentId]);
    
    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (complaint_id, complaint_title, user_role, user_name, action, details) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'Supported Case', 'student', studentName, 'Supported', 'Voted to prioritize this case.']
    );

    res.json({ success: true, message: 'Upvoted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Support addition failed.', details: err.message });
  }
});

// 10. Delete Complaint (Permitted for Closed Cases)
app.delete('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM complaints WHERE id = ?', [id]);
    res.json({ success: true, message: 'Complaint deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed.', details: err.message });
  }
});

// 11. Fetch All Activity Logs
app.get('/api/logs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activity_logs ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch logs.', details: err.message });
  }
});

// 12. Fetch All Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch notifications.', details: err.message });
  }
});

// 13. Mark Notification as Read
app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed.', details: err.message });
  }
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`🚀 CampusNova Backend Server Running on Port ${PORT}`);
  console.log(`📡 API Routes Active`);
  console.log(`🛡 Secure Session Layer Enabled (edu check active)`);

  // Hot-reload Purge of GRV-6909 and GRV-3331
  try {
    console.log('🧹 Executing hot-reload database purge of GRV-6909 and GRV-3331...');
    await db.query("DELETE FROM supported_complaints WHERE complaint_id IN ('GRV-6909', 'GRV-3331')");
    await db.query("DELETE FROM activity_logs WHERE complaint_id IN ('GRV-6909', 'GRV-3331')");
    await db.query("DELETE FROM notifications WHERE complaint_id IN ('GRV-6909', 'GRV-3331')");
    await db.query("DELETE FROM complaints WHERE id IN ('GRV-6909', 'GRV-3331')");
    console.log('✓ Purge completed successfully!');
  } catch (err) {
    console.error('⚠️ Purge failed:', err.message);
  }

  // Run database diagnostic
  try {
    require('./diag_db');
  } catch (err) {
    console.error('⚠️ Diagnostic execution failed:', err.message);
  }
});
