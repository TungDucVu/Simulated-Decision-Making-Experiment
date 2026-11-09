# Simulated Decision-Making Experiment Web Application

An interactive, responsive web application built with modern HTML5, CSS3, and JavaScript to conduct controlled behavioural experiments investigating the effect of a decision-making pause on consumer choice quality.

Designed for Group 99, Technical Communication, IIIT Delhi.

---

## 🌐 Live Deployment & Supabase Cloud Database

This application is deployed on **GitHub Pages** with live data recording directly to **Supabase**:

1. **GitHub Pages Deployment ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):**
   - Automatically builds and deploys `index.html`, `styles.css`, and `app.js` to GitHub Pages upon push to `main`.
   - Access URL: `https://tungducvu.github.io/Simulated-Decision-Making-Experiment/`

2. **Supabase Cloud Database Setup (1-Click SQL):**
   - In your [Supabase Dashboard](https://supabase.com/dashboard), open the **SQL Editor** &rarr; **New query**.
   - Copy & paste the contents of [`supabase_schema.sql`](supabase_schema.sql) and click **Run**.
   - Copy your **Project URL** and **Anon Public Key** from **Project Settings &rarr; API**.
   - In the web app, click the **⚙️ (Gear Icon)** in the header &rarr; paste the URL and Key &rarr; click **⚡ Test Supabase Connection** &rarr; **Save Settings**.
   - As participants complete the study, each response is inserted instantly into the `experiment_responses` table. You can view, filter, or download the data as CSV anytime with 1 click from the Supabase Table Editor!

---

## 🚀 Running Locally (Optional)

You can also run the experiment locally on your computer:

```powershell
# Option A: Double-click run_experiment.bat (Windows)

# Option B: Run with Node.js
node server.js

# Option C: Run with Python
python server.py
```
Open **`http://localhost:3000`** in your browser. All data will be saved locally to `data/experiment_results.csv`.

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

