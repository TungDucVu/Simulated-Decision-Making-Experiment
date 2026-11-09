# Simulated Decision-Making Experiment Web Application

An interactive, responsive web application built with modern HTML5, CSS3, and JavaScript to conduct controlled behavioural experiments investigating the effect of a decision-making pause on consumer choice quality.

Designed for Group 99, Technical Communication, IIIT Delhi.

---

## 🌐 Live Deployment & Supabase Cloud Architecture

This application is deployed directly on **GitHub Pages** with real-time serverless data collection powered by **Supabase**:

- **Live URL:** [https://tungducvu.github.io/Simulated-Decision-Making-Experiment/](https://tungducvu.github.io/Simulated-Decision-Making-Experiment/)
- **Zero-Setup Architecture:** Participants access the study on any laptop or phone. No local server, installation, or configuration is required.
- **Instant Cloud Persistence:** Upon questionnaire completion, participant metrics and all 18 survey responses are streamed directly into the Supabase database (`experiment_responses` table).
- **1-Click CSV Export:** In the Supabase Dashboard &rarr; Table Editor &rarr; `experiment_responses`, click **Export to CSV** to download the cumulative dataset at any time.

---

## 🔒 Security & Data Integrity Architecture

The project adheres to strict behavioral research data integrity and security practices:

1. **Row-Level Security (RLS) Protection:**
   - The Supabase table is guarded by PostgreSQL Row-Level Security.
   - Anonymous participants are granted **INSERT-only** access.
   - Anonymous clients **cannot** modify, overwrite, or delete existing participant records.
   - Participant confidentiality is preserved — survey responses cannot be scraped by other participants.

2. **Safe Client-Side Credentials:**
   - The application utilizes Supabase's public `anon` / `publishable` API key (`sb_publishable_...`).
   - The administrative `service_role` secret is **never** exposed or committed.
   - All client-side credentials are safe for public browser execution under RLS.

3. **Input Sanitization & XSS Defense:**
   - All dynamically rendered fields (participant IDs, choices, survey ratings, text feedback) pass through context-aware HTML entity encoding (`escapeHtml`) before DOM insertion.
   - All forms prevent submission without completion of required trade-off and recall checks.

4. **Clean Repository Policy:**
   - Raw participant CSVs and temporary files are excluded via `.gitignore`.
   - The repository contains no sensitive tokens, build artifacts, or participant PII.

---

## 🚀 Running Locally (Optional Offline Lab Backup)

For completely offline lab environments without internet access:

```powershell
# Option A: Double-click run_experiment.bat (Windows)

# Option B: Run with Node.js
node server.js

# Option C: Run with Python
python server.py
```
Open **`http://localhost:3000`** in any browser. In offline mode, responses are automatically appended to a local `data/experiment_results.csv` (which is git-ignored to prevent polluting the codebase).

---

## 🧪 Experimental Design & Flow

1. **Welcome Screen:** Neutral consumer study overview (hides experimental hypothesis to avoid priming).
2. **Participant Instructions:** Clear instructions regarding scenario evaluation and decision confirmation.
3. **Condition Assignment:**
   - **Experimental Group:** Confirmation button is locked during a visible countdown (default 10s) with a review prompt: *"Take a moment to review the key information before confirming your decision."*
   - **Control Group:** Confirmation button is immediately active upon selecting an option (no countdown, no delay).
4. **Task 1 (Online Shopping - Headphones):** Consumer price/value evaluation between Budget (₹1,499), Premium (₹2,499 with ANC), and Balanced (₹1,999) models.
5. **Task 2 (App Permissions - FitLife):** Privacy and sensor evaluation (Location with background tracking, contacts, fitness sensors, and ad disclosures). Options: *Allow All*, *Allow Only Essential*, *Deny Permissions*.
6. **Task 3 (Digital Subscription - StreamFlow):** Subscription auto-renewal evaluation (Introductory offer of ₹99/mo renewing at ₹499/mo automatically vs. Monthly ₹499 vs. Do Not Subscribe).
7. **Final Questionnaire (from form.pdf):** Full implementation of Group 99's study questionnaire:
   - **Task 1 Evaluation:** ANC price recall (Product B), Product A warranty/battery trade-offs, confidence rating (1–7), frustration rating (1–7).
   - **Task 2 Evaluation:** Requested permission recall, third-party disclosure consequences, confidence rating (1–7), frustration rating (1–7).
   - **Task 3 Evaluation:** Regular renewal price recall (₹499/mo), required cancellation procedure, confidence rating (1–7), frustration rating (1–7).
   - **Post-Study Reflection & Habits:** Decision regret (1–7), rushed perception (1–5), digital transaction frequency, impulsive clicking habits (1–7), speed vs. privacy/savings prior preferences, and open feedback.
8. **Executive Results & Report Page:** Comprehensive dashboard with:
   - **A. Experiment Overview:** Participant ID, Condition, Configured Pause, Completion Time.
   - **B. Decision Summary Table:** Task, Final Choice, Initial Choice, Changed?, Decision Time.
   - **C. Task-wise Analysis:** Contextual neutral observations and implications.
   - **D. Behavioural Summary:** Aggregate timing, revision counts, countdowns completed, privacy and auto-renewal indicators.
   - **E. Questionnaire Results:** Full survey response breakdown.
   - **F. Final Participant Summary:** Synthesized neutral behavioral review.
   - **Data Exports:**
     - 🖨️ **Print / Save PDF:** Produces an executive-styled PDF report via browser print dialog.
     - 📥 **Export CSV:** Downloads RFC 4180 compliant CSV file containing all timestamps, task choices, revisions, and survey responses.
     - 🔄 **Restart Experiment:** Wipes session, generates new anonymous participant ID, and starts fresh.

---

## 🔬 Researcher Settings (Configurable Pause Duration)

Click the **⚙️ (Gear Icon)** in the top right corner of the header at any time to open the **Researcher Settings Modal**:
- **Pause Duration:** Dynamically set the pause length to `0s`, `5s`, `10s` (default), `15s`, `20s`, `30s`, or any custom integer in seconds.
- **Group Assignment Override:**
  - `Balanced Random Assignment (50/50)`
  - `Force Experimental Group (Forced Pause)`
  - `Force Control Group (Immediate Confirmation)`
- **Local Session History:** Export all aggregated participant sessions across multiple runs to a single master CSV, or clear the local store.

Settings apply immediately to future participants while preserving the snapshot configuration of active participants.

---

## 📁 File Structure

- [`index.html`](file:///d:/IIITD_TUNG%20DUC%20VU_2023558/4/tcom/index.html) - Complete application structure with semantic markup and accessible elements.
- [`styles.css`](file:///d:/IIITD_TUNG%20DUC%20VU_2023558/4/tcom/styles.css) - Modern responsive styling, realistic UI components, and `@media print` rules for clean PDF rendering.
- [`app.js`](file:///d:/IIITD_TUNG%20DUC%20VU_2023558/4/tcom/app.js) - State management, countdown timers, event tracking, session persistence, CSV exporter, and report generator.
- [`REQUIREMENTS.md`](file:///d:/IIITD_TUNG%20DUC%20VU_2023558/4/tcom/REQUIREMENTS.md) - Original project specification document.

