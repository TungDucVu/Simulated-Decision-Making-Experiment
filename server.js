/**
 * Lightweight Zero-Dependency Local Experiment Server (Node.js)
 * Serves static files and automatically appends participant data to experiment_results.csv
 * Uses only Node.js built-in modules: http, fs, path, url
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const CSV_FILE = path.join(__dirname, 'data', 'experiment_results.csv');

// CSV Headers definition (matching form.pdf)
const CSV_HEADERS = [
  'Participant_ID',
  'Assigned_Condition',
  'Pause_Duration_Sec',
  'Date_Completed',
  'Total_Experiment_Time_Sec',
  // Task 1
  'Task1_Product_Choice',
  'Task1_Initial_Choice',
  'Task1_Changed',
  'Task1_Decision_Time_Sec',
  'Task1_Total_Time_Sec',
  // Task 2
  'Task2_Permission_Choice',
  'Task2_Initial_Choice',
  'Task2_Changed',
  'Task2_Decision_Time_Sec',
  'Task2_Total_Time_Sec',
  // Task 3
  'Task3_Subscription_Choice',
  'Task3_Initial_Choice',
  'Task3_Changed',
  'Task3_Decision_Time_Sec',
  'Task3_Total_Time_Sec',
  // form.pdf Survey Fields
  'T1_Recall_Price',
  'T1_Consequence_Tradeoff',
  'T1_Confidence_1to7',
  'T1_Frustration_1to7',
  'T2_Recall_Permissions',
  'T2_Consequence_Disclosure',
  'T2_Confidence_1to7',
  'T2_Frustration_1to7',
  'T3_Recall_Monthly_Price',
  'T3_Consequence_Cancellation',
  'T3_Confidence_1to7',
  'T3_Frustration_1to7',
  'Post_Regret_1to7',
  'Post_Rushed_1to5',
  'Post_Ecommerce_Freq',
  'Post_Impulsive_Click_1to7',
  'Post_Prior_Preference',
  'Participant_Feedback'
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function formatParticipantRow(data) {
  const t1 = (data.tasks && data.tasks.task1) || {};
  const t2 = (data.tasks && data.tasks.task2) || {};
  const t3 = (data.tasks && data.tasks.task3) || {};
  const q = data.questionnaire || {};

  const totalExpSec = (data.experimentEndTime && data.experimentStartTime)
    ? ((data.experimentEndTime - data.experimentStartTime) / 1000).toFixed(1)
    : (((t1.totalTimeSec || 0) + (t2.totalTimeSec || 0) + (t3.totalTimeSec || 0))).toFixed(1);

  const row = [
    escapeCSV(data.participantId || 'UNKNOWN'),
    escapeCSV(data.assignedCondition || 'UNKNOWN'),
    data.configuredPauseDuration || 0,
    escapeCSV(new Date().toISOString()),
    totalExpSec,
    // Task 1
    escapeCSV(t1.finalSelection || ''),
    escapeCSV(t1.initialSelection || ''),
    (t1.initialSelection !== t1.finalSelection || t1.selectionChanges > 0) ? 'YES' : 'NO',
    (t1.decisionTimeSec || 0).toFixed(2),
    (t1.totalTimeSec || 0).toFixed(2),
    // Task 2
    escapeCSV(t2.finalSelection || ''),
    escapeCSV(t2.initialSelection || ''),
    (t2.initialSelection !== t2.finalSelection || t2.selectionChanges > 0) ? 'YES' : 'NO',
    (t2.decisionTimeSec || 0).toFixed(2),
    (t2.totalTimeSec || 0).toFixed(2),
    // Task 3
    escapeCSV(t3.finalSelection || ''),
    escapeCSV(t3.initialSelection || ''),
    (t3.initialSelection !== t3.finalSelection || t3.selectionChanges > 0) ? 'YES' : 'NO',
    (t3.decisionTimeSec || 0).toFixed(2),
    (t3.totalTimeSec || 0).toFixed(2),
    // form.pdf Survey Fields
    escapeCSV(q.t1_recall || ''),
    escapeCSV(q.t1_consequence || ''),
    escapeCSV(q.t1_confidence || ''),
    escapeCSV(q.t1_frustration || ''),
    escapeCSV(q.t2_recall || ''),
    escapeCSV(q.t2_consequence || ''),
    escapeCSV(q.t2_confidence || ''),
    escapeCSV(q.t2_frustration || ''),
    escapeCSV(q.t3_recall || ''),
    escapeCSV(q.t3_consequence || ''),
    escapeCSV(q.t3_confidence || ''),
    escapeCSV(q.t3_frustration || ''),
    escapeCSV(q.post_regret || ''),
    escapeCSV(q.post_rushed || ''),
    escapeCSV(q.post_ecommerce_freq || ''),
    escapeCSV(q.post_impulsive_click || ''),
    escapeCSV(q.post_prior_pref || ''),
    escapeCSV(q.post_feedback || '')
  ];

  return row.join(',');
}

function countCSVEntries() {
  if (!fs.existsSync(CSV_FILE)) return 0;
  const content = fs.readFileSync(CSV_FILE, 'utf8').trim();
  if (!content) return 0;
  const lines = content.split('\n');
  return Math.max(0, lines.length - 1); // exclude header
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoint: Save new participant result
  if (req.method === 'POST' && pathname === '/api/save-result') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const participantData = JSON.parse(body);
        const row = formatParticipantRow(participantData);

        const fileExists = fs.existsSync(CSV_FILE);
        if (!fileExists) {
          // Write headers then row
          fs.writeFileSync(CSV_FILE, CSV_HEADERS.join(',') + '\n' + row + '\n', 'utf8');
        } else {
          // Append row
          fs.appendFileSync(CSV_FILE, row + '\n', 'utf8');
        }

        const totalParticipants = countCSVEntries();
        console.log(`[CSV Logger] Appended participant ${participantData.participantId}. Total recorded: ${totalParticipants}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Participant record appended to experiment_results.csv',
          participantId: participantData.participantId,
          totalRecorded: totalParticipants,
          filePath: CSV_FILE
        }));
      } catch (err) {
        console.error('Error saving participant data:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Get status / stats
  if (req.method === 'GET' && pathname === '/api/stats') {
    const totalParticipants = countCSVEntries();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      serverOnline: true,
      csvExists: fs.existsSync(CSV_FILE),
      totalParticipants: totalParticipants,
      csvFile: 'experiment_results.csv'
    }));
    return;
  }

  // API endpoint: Download master CSV
  if (req.method === 'GET' && pathname === '/api/download-csv') {
    if (!fs.existsSync(CSV_FILE)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('No experiment data collected yet.');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="experiment_results.csv"'
    });
    fs.createReadStream(CSV_FILE).pipe(res);
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Security check against directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Decision Experiment Server running at:`);
  console.log(`  👉 http://localhost:${PORT}`);
  console.log(`  Master CSV file: ${CSV_FILE}`);
  console.log(`  Every participant who finishes will be appended automatically.`);
  console.log(`=======================================================`);
});

