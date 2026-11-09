/**
 * GitHub Action Helper: Appends incoming participant data to data/experiment_results.csv
 * Invoked by .github/workflows/record_response.yml
 */

const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '..', 'data', 'experiment_results.csv');

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

function main() {
  const payloadStr = process.env.CLIENT_PAYLOAD || process.env.INPUT_DATA || '';
  if (!payloadStr) {
    console.error('No participant data payload provided in environment.');
    process.exit(1);
  }

  let parsed = null;
  try {
    parsed = JSON.parse(payloadStr);
  } catch (e) {
    console.error('Failed to parse JSON payload:', e);
    process.exit(1);
  }

  const participants = Array.isArray(parsed) ? parsed : [parsed];

  // Ensure data directory exists
  const dataDir = path.dirname(CSV_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const fileExists = fs.existsSync(CSV_FILE);
  if (!fileExists) {
    fs.writeFileSync(CSV_FILE, CSV_HEADERS.join(',') + '\n', 'utf8');
  }

  // Read existing content to check existing IDs
  let existingContent = fs.readFileSync(CSV_FILE, 'utf8');
  let appendedCount = 0;

  participants.forEach(p => {
    if (!p || !p.participantId) return;
    const row = formatParticipantRow(p);
    fs.appendFileSync(CSV_FILE, row + '\n', 'utf8');
    appendedCount++;
    console.log(`Appended participant: ${p.participantId}`);
  });

  console.log(`Successfully appended ${appendedCount} participant record(s) to ${CSV_FILE}`);
}

main();
