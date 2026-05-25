const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runDiag() {
  console.log('🔍 Starting database diagnostic...');
  try {
    const [complaints] = await db.query("SELECT * FROM complaints");
    const [logs] = await db.query("SELECT * FROM activity_logs");
    const [notifs] = await db.query("SELECT * FROM notifications");

    const diagResult = {
      timestamp: new Date().toISOString(),
      complaintsCount: complaints.length,
      complaints,
      logsCount: logs.length,
      logs,
      notifsCount: notifs.length,
      notifs
    };

    fs.writeFileSync(path.join(__dirname, 'diag_db.json'), JSON.stringify(diagResult, null, 2), 'utf8');
    console.log('✓ Diagnostic written to diag_db.json successfully!');
  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }
}

setTimeout(runDiag, 1500);
