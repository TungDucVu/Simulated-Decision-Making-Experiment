#!/usr/bin/env python3
"""
Lightweight Zero-Dependency Local Experiment Server (Python 3)
Serves static files and automatically appends participant data to experiment_results.csv
Uses only Python standard library: http.server, json, os, csv
"""

import http.server
import socketserver
import json
import os
import csv
from datetime import datetime

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, 'data', 'experiment_results.csv')

CSV_HEADERS = [
    'Participant_ID',
    'Assigned_Condition',
    'Pause_Duration_Sec',
    'Date_Completed',
    'Total_Experiment_Time_Sec',
    # Tasks
    'Task1_Product_Choice',
    'Task1_Initial_Choice',
    'Task1_Changed',
    'Task1_Decision_Time_Sec',
    'Task1_Total_Time_Sec',
    'Task2_Permission_Choice',
    'Task2_Initial_Choice',
    'Task2_Changed',
    'Task2_Decision_Time_Sec',
    'Task2_Total_Time_Sec',
    'Task3_Subscription_Choice',
    'Task3_Initial_Choice',
    'Task3_Changed',
    'Task3_Decision_Time_Sec',
    'Task3_Total_Time_Sec',
    # form.pdf fields
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
]

def format_row(data):
    t1 = data.get('tasks', {}).get('task1', {})
    t2 = data.get('tasks', {}).get('task2', {})
    t3 = data.get('tasks', {}).get('task3', {})
    q = data.get('questionnaire', {})

    total_time = 0.0
    if data.get('experimentEndTime') and data.get('experimentStartTime'):
        total_time = (data['experimentEndTime'] - data['experimentStartTime']) / 1000.0
    else:
        total_time = (t1.get('totalTimeSec', 0) or 0) + (t2.get('totalTimeSec', 0) or 0) + (t3.get('totalTimeSec', 0) or 0)

    t1_changed = 'YES' if (t1.get('initialSelection') != t1.get('finalSelection') or (t1.get('selectionChanges', 0) > 0)) else 'NO'
    t2_changed = 'YES' if (t2.get('initialSelection') != t2.get('finalSelection') or (t2.get('selectionChanges', 0) > 0)) else 'NO'
    t3_changed = 'YES' if (t3.get('initialSelection') != t3.get('finalSelection') or (t3.get('selectionChanges', 0) > 0)) else 'NO'

    return [
        data.get('participantId', 'UNKNOWN'),
        data.get('assignedCondition', 'UNKNOWN'),
        data.get('configuredPauseDuration', 0),
        datetime.now().isoformat(),
        f"{total_time:.1f}",
        t1.get('finalSelection', ''),
        t1.get('initialSelection', ''),
        t1_changed,
        f"{t1.get('decisionTimeSec', 0):.2f}",
        f"{t1.get('totalTimeSec', 0):.2f}",
        t2.get('finalSelection', ''),
        t2.get('initialSelection', ''),
        t2_changed,
        f"{t2.get('decisionTimeSec', 0):.2f}",
        f"{t2.get('totalTimeSec', 0):.2f}",
        t3.get('finalSelection', ''),
        t3.get('initialSelection', ''),
        t3_changed,
        f"{t3.get('decisionTimeSec', 0):.2f}",
        f"{t3.get('totalTimeSec', 0):.2f}",
        # form.pdf fields
        q.get('t1_recall', ''),
        q.get('t1_consequence', ''),
        q.get('t1_confidence', ''),
        q.get('t1_frustration', ''),
        q.get('t2_recall', ''),
        q.get('t2_consequence', ''),
        q.get('t2_confidence', ''),
        q.get('t2_frustration', ''),
        q.get('t3_recall', ''),
        q.get('t3_consequence', ''),
        q.get('t3_confidence', ''),
        q.get('t3_frustration', ''),
        q.get('post_regret', ''),
        q.get('post_rushed', ''),
        q.get('post_ecommerce_freq', ''),
        q.get('post_impulsive_click', ''),
        q.get('post_prior_pref', ''),
        q.get('post_feedback', '')
    ]

def count_entries():
    if not os.path.exists(CSV_FILE):
        return 0
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        lines = [l for l in f if l.strip()]
        return max(0, len(lines) - 1)

class ExperimentHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/save-result':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            file_exists = os.path.exists(CSV_FILE)
            with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(CSV_HEADERS)
                writer.writerow(format_row(data))

            total = count_entries()
            print(f"[CSV Logger] Saved participant {data.get('participantId')}. Total: {total}")

            resp = json.dumps({
                'success': True,
                'participantId': data.get('participantId'),
                'totalRecorded': total,
                'filePath': CSV_FILE
            }).encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(resp)
            return

        super().do_POST()

    def do_GET(self):
        if self.path == '/api/stats':
            resp = json.dumps({
                'serverOnline': True,
                'totalParticipants': count_entries(),
                'csvFile': 'experiment_results.csv'
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(resp)
            return

        super().do_GET()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), ExperimentHandler) as httpd:
        print("=======================================================")
        print(f"  Decision Experiment Server running at:")
        print(f"  👉 http://localhost:{PORT}")
        print(f"  Master CSV file: {CSV_FILE}")
        print(f"  Every participant who finishes will be appended automatically.")
        print("=======================================================")
        httpd.serve_forever()

