/**
 * Simulated Decision-Making Experiment Web Application
 * Core Client-Side Logic & State Controller
 * Adheres strictly to REQUIREMENTS.md
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEYS = {
    CURRENT_SESSION: 'decision_exp_current_session',
    RESEARCHER_CONFIG: 'decision_exp_researcher_config',
    ALL_SESSIONS_LOG: 'decision_exp_all_sessions_log'
  };

  // Default Experimental Settings
  const DEFAULT_CONFIG = {
    pauseDuration: 10, // seconds for experimental group
    assignmentMode: 'random', // 'random', 'experimental', 'control'
    applyAllTasks: true,
    taskDurations: {
      task1: 10,
      task2: 10,
      task3: 10
    },
    supabaseUrl: 'https://ipervshaysndnhkiulig.supabase.co',
    supabaseKey: 'sb_publishable_SFpH8o-ExvSriR_diEoZjw_n-I2DWNI',
    supabaseTable: 'experiment_responses'
  };

  // --- Application State Model ---
  let appState = {
    participantId: '',
    assignedCondition: '', // 'Experimental' or 'Control'
    configuredPauseDuration: 10,
    hasSyncedToMaster: false,
    currentScreen: 'welcome', // 'welcome', 'instructions', 'task1', 'task2', 'task3', 'questionnaire', 'report'
    experimentStartTime: null,
    experimentEndTime: null,
    
    // Per-task metrics
    tasks: {
      task1: {
        id: 'task1',
        title: 'Consumer Price/Value',
        taskStartTime: null,
        firstSelectionTime: null,
        finalSelectionTime: null,
        confirmationTime: null,
        initialSelection: null,
        finalSelection: null,
        selectionChanges: 0,
        decisionTimeSec: 0,
        totalTimeSec: 0,
        countdownDuration: 0,
        countdownCompleted: false
      },
      task2: {
        id: 'task2',
        title: 'App Privacy/Permissions',
        taskStartTime: null,
        firstSelectionTime: null,
        finalSelectionTime: null,
        confirmationTime: null,
        initialSelection: null,
        finalSelection: null,
        selectionChanges: 0,
        decisionTimeSec: 0,
        totalTimeSec: 0,
        countdownDuration: 0,
        countdownCompleted: false
      },
      task3: {
        id: 'task3',
        title: 'Subscription Auto-Renewal',
        taskStartTime: null,
        firstSelectionTime: null,
        finalSelectionTime: null,
        confirmationTime: null,
        initialSelection: null,
        finalSelection: null,
        selectionChanges: 0,
        decisionTimeSec: 0,
        totalTimeSec: 0,
        countdownDuration: 0,
        countdownCompleted: false
      }
    },
    
    // Final questionnaire results (from form.pdf)
    questionnaire: {
      t1_recall: '',
      t1_consequence: '',
      t1_confidence: '',
      t1_frustration: '',
      t2_recall: '',
      t2_consequence: '',
      t2_confidence: '',
      t2_frustration: '',
      t3_recall: '',
      t3_consequence: '',
      t3_confidence: '',
      t3_frustration: '',
      post_regret: '',
      post_rushed: '',
      post_ecommerce_freq: '',
      post_impulsive_click: '',
      post_prior_pref: '',
      post_feedback: ''
    },

    // Timer tracking for current task
    timer: {
      active: false,
      intervalId: null,
      remainingSec: 0,
      targetTime: null
    }
  };

  // --- Helper: Generate Anonymous Participant ID ---
  function generateParticipantId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'PART-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  // --- Helper: Format Milliseconds / Seconds ---
  function formatSeconds(sec) {
    if (isNaN(sec) || sec === null) return '0.0s';
    return (parseFloat(sec)).toFixed(1) + 's';
  }

  function formatTimeMS(ms) {
    if (!ms) return '0.0s';
    return (ms / 1000).toFixed(1) + 's';
  }

  // --- Researcher Configuration Handling ---
  function getResearcherConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RESEARCHER_CONFIG);
      if (stored) {
        return Object.assign({}, DEFAULT_CONFIG, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading config from localStorage', e);
    }
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function saveResearcherConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEYS.RESEARCHER_CONFIG, JSON.stringify(cfg));
    } catch (e) {
      console.warn('Error writing config to localStorage', e);
    }
  }

  // --- Session Persistence ---
  function persistSession() {
    try {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(appState));
    } catch (e) {
      console.warn('Could not persist session', e);
    }
  }

  function restoreSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.participantId) {
          appState = parsed;
          return true;
        }
      }
    } catch (e) {
      console.warn('Could not restore session', e);
    }
    return false;
  }

  // Save completed session to persistent archive
  function archiveSession() {
    try {
      const rawArchive = localStorage.getItem(STORAGE_KEYS.ALL_SESSIONS_LOG);
      let archive = rawArchive ? JSON.parse(rawArchive) : [];
      // avoid duplicates by ID
      archive = archive.filter(item => item.participantId !== appState.participantId);
      archive.push(JSON.parse(JSON.stringify(appState)));
      localStorage.setItem(STORAGE_KEYS.ALL_SESSIONS_LOG, JSON.stringify(archive));
      return archive;
    } catch (e) {
      console.warn('Failed to archive session', e);
      return [appState];
    }
  }

  // --- Supabase Cloud Database Helpers ---
  function formatParticipantForSupabase(data) {
    const t1 = (data.tasks && data.tasks.task1) || {};
    const t2 = (data.tasks && data.tasks.task2) || {};
    const t3 = (data.tasks && data.tasks.task3) || {};
    const q = data.questionnaire || {};

    const totalExpSec = (data.experimentEndTime && data.experimentStartTime)
      ? parseFloat(((data.experimentEndTime - data.experimentStartTime) / 1000).toFixed(1))
      : parseFloat((((t1.totalTimeSec || 0) + (t2.totalTimeSec || 0) + (t3.totalTimeSec || 0))).toFixed(1));

    return {
      participant_id: data.participantId || 'UNKNOWN',
      assigned_condition: data.assignedCondition || 'UNKNOWN',
      pause_duration_sec: data.configuredPauseDuration || 0,
      date_completed: new Date().toISOString(),
      total_experiment_time_sec: totalExpSec,

      // Task 1
      task1_product_choice: t1.finalSelection || '',
      task1_initial_choice: t1.initialSelection || '',
      task1_changed: (t1.initialSelection !== t1.finalSelection || t1.selectionChanges > 0) ? 'YES' : 'NO',
      task1_decision_time_sec: parseFloat((t1.decisionTimeSec || 0).toFixed(2)),
      task1_total_time_sec: parseFloat((t1.totalTimeSec || 0).toFixed(2)),

      // Task 2
      task2_permission_choice: t2.finalSelection || '',
      task2_initial_choice: t2.initialSelection || '',
      task2_changed: (t2.initialSelection !== t2.finalSelection || t2.selectionChanges > 0) ? 'YES' : 'NO',
      task2_decision_time_sec: parseFloat((t2.decisionTimeSec || 0).toFixed(2)),
      task2_total_time_sec: parseFloat((t2.totalTimeSec || 0).toFixed(2)),

      // Task 3
      task3_subscription_choice: t3.finalSelection || '',
      task3_initial_choice: t3.initialSelection || '',
      task3_changed: (t3.initialSelection !== t3.finalSelection || t3.selectionChanges > 0) ? 'YES' : 'NO',
      task3_decision_time_sec: parseFloat((t3.decisionTimeSec || 0).toFixed(2)),
      task3_total_time_sec: parseFloat((t3.totalTimeSec || 0).toFixed(2)),

      // form.pdf Survey Fields
      t1_recall_price: q.t1_recall || '',
      t1_consequence_tradeoff: q.t1_consequence || '',
      t1_confidence_1to7: q.t1_confidence || '',
      t1_frustration_1to7: q.t1_frustration || '',

      t2_recall_permissions: q.t2_recall || '',
      t2_consequence_disclosure: q.t2_consequence || '',
      t2_confidence_1to7: q.t2_confidence || '',
      t2_frustration_1to7: q.t2_frustration || '',

      t3_recall_monthly_price: q.t3_recall || '',
      t3_consequence_cancellation: q.t3_consequence || '',
      t3_confidence_1to7: q.t3_confidence || '',
      t3_frustration_1to7: q.t3_frustration || '',

      post_regret_1to7: q.post_regret || '',
      post_rushed_1to5: q.post_rushed || '',
      post_ecommerce_freq: q.post_ecommerce_freq || '',
      post_impulsive_click_1to7: q.post_impulsive_click || '',
      post_prior_preference: q.post_prior_pref || '',
      participant_feedback: q.post_feedback || '',

      raw_data: data
    };
  }

  async function postToSupabase(url, key, table, payload) {
    const cleanUrl = (url || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
    const cleanKey = (key || '').trim().replace(/^["']|["']$/g, '');
    const cleanTable = (table || 'experiment_responses').trim();

    if (!cleanUrl || !cleanKey) {
      throw new Error('Supabase URL or Key not provided');
    }

    const endpoint = `${cleanUrl}/rest/v1/${cleanTable}`;
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });
  }

  // Sync participant result to Supabase cloud, local server, or browser master archive
  async function syncParticipantToMasterCSV(allSessions) {
    const titleElem = document.getElementById('csv-status-title');
    const detailElem = document.getElementById('csv-status-detail');
    const count = (allSessions && allSessions.length) || 1;

    // 1. Attempt Supabase Cloud Insert if configured
    const config = getResearcherConfig();
    if (config.supabaseUrl && config.supabaseKey) {
      try {
        const payload = formatParticipantForSupabase(appState);
        const res = await postToSupabase(config.supabaseUrl, config.supabaseKey, config.supabaseTable, payload);
        if (res.ok) {
          if (titleElem) titleElem.textContent = '⚡ Synced to Supabase Cloud Database';
          if (detailElem) {
            detailElem.textContent = `Participant ${appState.participantId} recorded in table '${config.supabaseTable || 'experiment_responses'}'. Instant cloud sync complete!`;
          }
          return;
        } else {
          const errText = await res.text();
          console.warn(`Supabase API error (${res.status}):`, errText);
        }
      } catch (err) {
        console.warn('Supabase sync error:', err);
      }
    }

    // 2. Attempt to post to local server if running (Node.js or Python)
    try {
      const res = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appState)
      });

      if (res.ok) {
        const data = await res.json();
        if (titleElem) titleElem.textContent = '✅ Appended to experiment_results.csv';
        if (detailElem) {
          detailElem.textContent = `Participant ${appState.participantId} recorded. Master file has ${data.totalRecorded} total participant(s).`;
        }
        return;
      }
    } catch (e) {
      // Server not reachable (e.g. opened directly from file system or GitHub Pages)
    }

    // 3. Client-side fallback: saved in persistent browser storage
    if (titleElem) titleElem.textContent = '✅ Appended to Master Dataset';
    if (detailElem) {
      detailElem.textContent = `Participant ${appState.participantId} logged locally. Total stored participants: ${count}. Click "Export Master CSV" to download cumulative file.`;
    }
  }

  // --- Audio Feedback (Subtle Web Audio chime when timer completes) ---
  function playCompletionChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy or unavailable - silently ignore
    }
  }

  // --- Screen Navigation & Progress Management ---
  const screens = {
    welcome: document.getElementById('screen-welcome'),
    instructions: document.getElementById('screen-instructions'),
    assignment: document.getElementById('screen-assignment'),
    task1: document.getElementById('screen-task-1'),
    task2: document.getElementById('screen-task-2'),
    task3: document.getElementById('screen-task-3'),
    questionnaire: document.getElementById('screen-questionnaire'),
    report: document.getElementById('screen-report')
  };

  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressStepText = document.getElementById('progress-step-text');
  const progressPctText = document.getElementById('progress-pct-text');
  const sessionBadge = document.getElementById('session-badge');
  const headerPid = document.getElementById('header-pid');

  function showScreen(screenId) {
    appState.currentScreen = screenId;
    Object.keys(screens).forEach(id => {
      if (screens[id]) {
        screens[id].classList.toggle('active', id === screenId);
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Header badge
    if (appState.participantId && screenId !== 'welcome') {
      sessionBadge.style.display = 'inline-block';
      headerPid.textContent = appState.participantId;
    } else {
      sessionBadge.style.display = 'none';
    }

    // Update Progress Bar
    updateProgressBar(screenId);

    // Screen specific entry logic
    if (screenId === 'task1') {
      initTaskScreen('task1');
    } else if (screenId === 'task2') {
      initTaskScreen('task2');
    } else if (screenId === 'task3') {
      initTaskScreen('task3');
    } else if (screenId === 'report') {
      progressContainer.style.display = 'none';
      renderReport();
    }

    persistSession();
  }

  function updateProgressBar(screenId) {
    if (['task1', 'task2', 'task3', 'questionnaire'].includes(screenId)) {
      progressContainer.style.display = 'block';
      let stepText = '';
      let pct = 0;
      switch (screenId) {
        case 'task1':
          stepText = 'Task 1 of 3: Consumer Comparison';
          pct = 25;
          break;
        case 'task2':
          stepText = 'Task 2 of 3: App Permissions';
          pct = 50;
          break;
        case 'task3':
          stepText = 'Task 3 of 3: Subscription Terms';
          pct = 75;
          break;
        case 'questionnaire':
          stepText = 'Final Questionnaire';
          pct = 90;
          break;
      }
      progressFill.style.width = pct + '%';
      progressStepText.textContent = stepText;
      progressPctText.textContent = pct + '%';
    } else {
      progressContainer.style.display = 'none';
    }
  }

  // --- Experimental Group Assignment ---
  function initializeParticipantSession() {
    const config = getResearcherConfig();
    appState.participantId = generateParticipantId();
    appState.configuredPauseDuration = isNaN(parseInt(config.pauseDuration, 10)) ? 10 : Math.max(0, parseInt(config.pauseDuration, 10));
    appState.taskDurations = config.applyAllTasks ? {
      task1: appState.configuredPauseDuration,
      task2: appState.configuredPauseDuration,
      task3: appState.configuredPauseDuration
    } : Object.assign({ task1: 10, task2: 10, task3: 10 }, config.taskDurations);

    // Condition assignment
    if (config.assignmentMode === 'experimental') {
      appState.assignedCondition = 'Experimental';
    } else if (config.assignmentMode === 'control') {
      appState.assignedCondition = 'Control';
    } else {
      // Balanced random 50/50
      appState.assignedCondition = Math.random() < 0.5 ? 'Experimental' : 'Control';
    }

    appState.experimentStartTime = Date.now();
    appState.experimentEndTime = null;
    appState.hasSyncedToMaster = false;

    if (appState.timer.intervalId) {
      clearInterval(appState.timer.intervalId);
      appState.timer.intervalId = null;
    }
    appState.timer.active = false;
    appState.timer.targetTime = null;

    const taskTitles = {
      task1: 'Consumer Price/Value',
      task2: 'App Privacy/Permissions',
      task3: 'Subscription Auto-Renewal'
    };

    ['task1', 'task2', 'task3'].forEach(k => {
      appState.tasks[k] = {
        id: k,
        title: taskTitles[k],
        taskStartTime: null,
        firstSelectionTime: null,
        finalSelectionTime: null,
        confirmationTime: null,
        initialSelection: null,
        finalSelection: null,
        selectionChanges: 0,
        decisionTimeSec: 0,
        totalTimeSec: 0,
        countdownDuration: 0,
        countdownCompleted: false
      };
    });

    persistSession();

    // Show assignment animation briefly (500ms) for realism
    showScreen('assignment');
    setTimeout(() => {
      showScreen('task1');
    }, 600);
  }

  // --- Task Element Helper ---
  function getTaskElements(taskId) {
    const taskNum = taskId.replace('task', '');
    return {
      taskNum,
      pauseBanner: document.getElementById(`pause-container-${taskNum}`),
      countdownVal: document.getElementById(`countdown-val-${taskNum}`),
      confirmBtn: document.getElementById(`btn-confirm-task-${taskNum}`),
      statusText: document.getElementById(`status-task-${taskNum}`)
    };
  }

  function getDefaultButtonLabel(taskId) {
    switch (taskId) {
      case 'task1': return 'Confirm Purchase Decision →';
      case 'task2': return 'Confirm Permission Choice →';
      case 'task3': return 'Confirm Subscription Choice →';
      default: return 'Confirm Decision →';
    }
  }

  function updateConfirmButtonState(taskId, remainingSec = 0) {
    const task = appState.tasks[taskId];
    const { confirmBtn, statusText } = getTaskElements(taskId);
    if (!confirmBtn) return;

    const isExperimental = appState.assignedCondition === 'Experimental';
    const isLocked = isExperimental && !task.countdownCompleted;

    if (!task.finalSelection) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = getDefaultButtonLabel(taskId);
      if (statusText) statusText.textContent = 'Please select an option above to proceed.';
      return;
    }

    if (isLocked) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = `Reviewing... (${remainingSec}s remaining)`;
      if (statusText) {
        statusText.innerHTML = `Selected: <strong>${escapeHtml(task.finalSelection)}</strong> &bull; Please review key information (${remainingSec}s remaining)`;
      }
    } else {
      confirmBtn.disabled = false;
      confirmBtn.textContent = getDefaultButtonLabel(taskId);
      if (statusText) {
        statusText.innerHTML = `Selected: <strong>${escapeHtml(task.finalSelection)}</strong> &bull; <span style="color: #059669; font-weight: 600;">Ready to confirm</span>`;
      }
    }
  }

  // --- Task Screen Engine ---
  function initTaskScreen(taskId) {
    const task = appState.tasks[taskId];
    if (!task.taskStartTime) {
      task.taskStartTime = Date.now();
    }

    const { pauseBanner, countdownVal, confirmBtn, statusText } = getTaskElements(taskId);
    if (!confirmBtn) return;

    // Determine pause requirement for this condition
    const isExperimental = appState.assignedCondition === 'Experimental';
    const taskPauseSec = (appState.taskDurations && appState.taskDurations[taskId] !== undefined)
      ? appState.taskDurations[taskId]
      : appState.configuredPauseDuration;
    const pauseSeconds = isExperimental ? taskPauseSec : 0;
    task.countdownDuration = pauseSeconds;

    // Restore previously selected option if user reloaded
    if (task.finalSelection) {
      markOptionSelected(taskId, task.finalSelection);
    }

    // Timer handling
    if (isExperimental && pauseSeconds > 0) {
      // Check if timer already finished in this session
      if (task.countdownCompleted) {
        if (pauseBanner) {
          pauseBanner.style.display = 'block';
          pauseBanner.classList.add('completed');
          const h4 = pauseBanner.querySelector('h4');
          const p = pauseBanner.querySelector('p');
          if (h4) h4.textContent = 'Review Period Complete';
          if (p) p.textContent = 'You may now confirm your selection.';
        }
        if (countdownVal) countdownVal.textContent = '0';
        updateConfirmButtonState(taskId, 0);
      } else if (appState.timer.active && appState.timer.targetTime && task.finalSelection) {
        // Resume active countdown if reloaded mid-countdown after selection
        if (pauseBanner) pauseBanner.style.display = 'block';
        startCountdown(taskId, pauseSeconds, countdownVal, confirmBtn, pauseBanner);
      } else {
        // Option NOT selected yet: DO NOT start timer yet!
        // Timer will start automatically when participant selects an option
        if (pauseBanner) pauseBanner.style.display = 'none';
        if (countdownVal) countdownVal.textContent = pauseSeconds;
        task.countdownCompleted = false;
        updateConfirmButtonState(taskId, pauseSeconds);
      }
    } else {
      // Control Group: Immediate Confirmation
      if (pauseBanner) pauseBanner.style.display = 'none';
      task.countdownCompleted = true;
      updateConfirmButtonState(taskId, 0);
    }
  }

  function startCountdown(taskId, durationSec, displayElem, confirmBtn, bannerElem) {
    const task = appState.tasks[taskId];

    if (bannerElem) {
      bannerElem.style.display = 'block';
      bannerElem.classList.remove('completed');
      bannerElem.style.background = '';
      bannerElem.style.borderColor = '';
      const h4 = bannerElem.querySelector('h4');
      const p = bannerElem.querySelector('p');
      if (h4) h4.textContent = 'Review Period in Progress';
      if (p) p.textContent = 'Take a moment to review the key information before confirming your decision.';
    }

    // Clear any previous interval
    if (appState.timer.intervalId) {
      clearInterval(appState.timer.intervalId);
    }

    // Compute remaining time taking into account session persistence
    let remaining = durationSec;
    if (appState.timer.targetTime && appState.timer.active) {
      const now = Date.now();
      remaining = Math.max(0, Math.ceil((appState.timer.targetTime - now) / 1000));
    } else {
      appState.timer.targetTime = Date.now() + (durationSec * 1000);
      appState.timer.active = true;
    }

    if (displayElem) displayElem.textContent = remaining;
    updateConfirmButtonState(taskId, remaining);

    if (remaining <= 0) {
      completeCountdown(task, taskId, displayElem, bannerElem);
      return;
    }

    appState.timer.intervalId = setInterval(() => {
      const now = Date.now();
      const rem = Math.max(0, Math.ceil((appState.timer.targetTime - now) / 1000));
      if (displayElem) displayElem.textContent = rem;
      updateConfirmButtonState(taskId, rem);

      if (rem <= 0) {
        clearInterval(appState.timer.intervalId);
        appState.timer.intervalId = null;
        appState.timer.active = false;
        completeCountdown(task, taskId, displayElem, bannerElem);
      }
      persistSession();
    }, 250);
  }

  function completeCountdown(task, taskId, displayElem, bannerElem) {
    task.countdownCompleted = true;
    if (displayElem) displayElem.textContent = '0';
    if (bannerElem) {
      bannerElem.style.background = '#ecfdf5';
      bannerElem.style.borderColor = '#10b981';
      const h4 = bannerElem.querySelector('h4');
      const p = bannerElem.querySelector('p');
      if (h4) h4.textContent = 'Review Period Complete';
      if (p) p.textContent = 'You may now confirm your selection.';
    }
    updateConfirmButtonState(taskId, 0);
    playCompletionChime();
    persistSession();
  }

  function markOptionSelected(taskId, optionValue) {
    const taskCards = document.querySelectorAll(`.choice-card[data-task="${taskId}"]`);
    taskCards.forEach(card => {
      const isMatch = card.getAttribute('data-option') === optionValue;
      card.classList.toggle('selected', isMatch);
    });
  }

  // --- Option Selection Event Listener ---
  function handleOptionSelect(e) {
    const card = e.target.closest('.choice-card');
    if (!card) return;

    const taskId = card.getAttribute('data-task');
    const option = card.getAttribute('data-option');
    if (!taskId || !option) return;

    const task = appState.tasks[taskId];
    const now = Date.now();

    // First selection
    if (!task.firstSelectionTime) {
      task.firstSelectionTime = now;
      task.initialSelection = option;
    } else if (task.finalSelection && task.finalSelection !== option) {
      task.selectionChanges += 1;
    }

    task.finalSelection = option;
    task.finalSelectionTime = now;

    markOptionSelected(taskId, option);

    const isExperimental = appState.assignedCondition === 'Experimental';
    const taskPauseSec = (appState.taskDurations && appState.taskDurations[taskId] !== undefined)
      ? appState.taskDurations[taskId]
      : appState.configuredPauseDuration;
    const pauseSeconds = isExperimental ? taskPauseSec : 0;

    const { pauseBanner, countdownVal, confirmBtn } = getTaskElements(taskId);

    // If Experimental group with pause:
    if (isExperimental && pauseSeconds > 0) {
      if (!task.countdownCompleted) {
        // Start review countdown upon selecting an option
        if (pauseBanner) pauseBanner.style.display = 'block';
        if (!appState.timer.active) {
          startCountdown(taskId, pauseSeconds, countdownVal, confirmBtn, pauseBanner);
        } else {
          let rem = Math.max(0, Math.ceil((appState.timer.targetTime - Date.now()) / 1000));
          updateConfirmButtonState(taskId, rem);
        }
      } else {
        // Countdown was already completed previously for this task
        updateConfirmButtonState(taskId, 0);
      }
    } else {
      // Control group: immediate confirmation
      task.countdownCompleted = true;
      updateConfirmButtonState(taskId, 0);
    }

    // Smoothly ensure confirm button is visible in viewport
    if (confirmBtn) {
      confirmBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    persistSession();
  }

  // --- Confirmation Event Listener ---
  function handleTaskConfirm(taskId) {
    const task = appState.tasks[taskId];
    if (!task.finalSelection) return;

    const now = Date.now();
    task.confirmationTime = now;

    // Calculate decision time (excluding forced pause)
    task.decisionTimeSec = (task.finalSelectionTime - task.taskStartTime) / 1000;
    task.totalTimeSec = (task.confirmationTime - task.taskStartTime) / 1000;

    // Reset countdown timer state for next task
    if (appState.timer.intervalId) {
      clearInterval(appState.timer.intervalId);
      appState.timer.intervalId = null;
    }
    appState.timer.active = false;
    appState.timer.targetTime = null;

    persistSession();

    // Sequence transition
    if (taskId === 'task1') {
      showScreen('task2');
    } else if (taskId === 'task2') {
      showScreen('task3');
    } else if (taskId === 'task3') {
      showScreen('questionnaire');
    }
  }

  // --- Questionnaire Submission (from form.pdf) ---
  async function handleSurveySubmit(e) {
    e.preventDefault();
    const form = document.getElementById('form-questionnaire');
    const formData = new FormData(form);

    appState.questionnaire.t1_recall = formData.get('t1_recall') || '';
    appState.questionnaire.t1_consequence = formData.get('t1_consequence') || '';
    appState.questionnaire.t1_confidence = formData.get('t1_confidence') || '';
    appState.questionnaire.t1_frustration = formData.get('t1_frustration') || '';

    appState.questionnaire.t2_recall = formData.get('t2_recall') || '';
    appState.questionnaire.t2_consequence = formData.get('t2_consequence') || '';
    appState.questionnaire.t2_confidence = formData.get('t2_confidence') || '';
    appState.questionnaire.t2_frustration = formData.get('t2_frustration') || '';

    appState.questionnaire.t3_recall = formData.get('t3_recall') || '';
    appState.questionnaire.t3_consequence = formData.get('t3_consequence') || '';
    appState.questionnaire.t3_confidence = formData.get('t3_confidence') || '';
    appState.questionnaire.t3_frustration = formData.get('t3_frustration') || '';

    appState.questionnaire.post_regret = formData.get('post_regret') || '';
    appState.questionnaire.post_rushed = formData.get('post_rushed') || '';
    appState.questionnaire.post_ecommerce_freq = formData.get('post_ecommerce_freq') || '';
    appState.questionnaire.post_impulsive_click = formData.get('post_impulsive_click') || '';
    appState.questionnaire.post_prior_pref = formData.get('post_prior_pref') || '';
    appState.questionnaire.post_feedback = (document.getElementById('txt-feedback') ? document.getElementById('txt-feedback').value.trim() : '');

    appState.experimentEndTime = Date.now();

    const allSessions = archiveSession();
    persistSession();
    showScreen('report');

    // Automatically append participant result to master CSV
    await syncParticipantToMasterCSV(allSessions);
    appState.hasSyncedToMaster = true;
    persistSession();
  }

  // --- Report Generation & Presentation ---
  function renderReport() {
    // A. Experiment Overview
    document.getElementById('rep-pid').textContent = appState.participantId || '-';
    document.getElementById('rep-group').textContent =
      appState.assignedCondition === 'Experimental' ? 'Experimental (10s Pause)' : 'Control (Immediate)';
    document.getElementById('rep-pause').textContent =
      appState.assignedCondition === 'Experimental' ? `${appState.configuredPauseDuration}s imposed` : '0s (None)';

    const totalExpTimeMs = appState.experimentEndTime && appState.experimentStartTime
      ? (appState.experimentEndTime - appState.experimentStartTime)
      : (appState.tasks.task1.totalTimeSec + appState.tasks.task2.totalTimeSec + appState.tasks.task3.totalTimeSec) * 1000;
    document.getElementById('rep-total-time').textContent = formatTimeMS(totalExpTimeMs);

    // B. Decision Summary Table
    const tableBody = document.getElementById('rep-table-body');
    tableBody.innerHTML = '';

    const taskList = [
      { key: 'task1', name: 'Task 1: Consumer Price/Value' },
      { key: 'task2', name: 'Task 2: App Privacy & Permissions' },
      { key: 'task3', name: 'Task 3: Subscription & Auto-Renewal' }
    ];

    let totalDecTime = 0;
    let totalChanges = 0;
    let countdownsDone = 0;

    taskList.forEach(item => {
      const t = appState.tasks[item.key];
      const row = document.createElement('tr');
      const changed = (t.initialSelection !== t.finalSelection || t.selectionChanges > 0) ? 'Yes' : 'No';
      if (changed === 'Yes') totalChanges++;
      if (t.countdownCompleted) countdownsDone++;
      totalDecTime += (t.decisionTimeSec || 0);

      row.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td>${escapeHtml(t.finalSelection || 'None')}</td>
        <td>${escapeHtml(t.initialSelection || 'None')}</td>
        <td><span class="${changed === 'Yes' ? 'badge-yes' : 'badge-no'}">${changed}</span></td>
        <td>${formatSeconds(t.decisionTimeSec)}</td>
      `;
      tableBody.appendChild(row);
    });

    // C. Task-wise Detailed Analysis
    const taskAnalysesDiv = document.getElementById('rep-task-analyses');
    taskAnalysesDiv.innerHTML = '';

    const interpretations = {
      task1: {
        'Product A': 'Selected the budget-tier option (₹1,499) with lower battery life (20h) and standard 6-month warranty.',
        'Product B': 'Selected the highest-priced tier (₹2,499) offering maximum battery life (35h) and Active Noise Cancellation.',
        'Product C': 'Selected the mid-tier option (₹1,999) balancing 30 hours battery life and 1-year warranty at an intermediate price.'
      },
      task2: {
        'Allow All Permissions': 'Granted comprehensive system access including background location tracking, contacts, and ad data sharing.',
        'Allow Only Essential Permissions': 'Adopted a selective privacy approach, restricting background location tracking and external ad analytics.',
        'Deny Permissions': 'Exercised maximum data minimization, withholding all non-essential sensor and identifier access.'
      },
      task3: {
        'Start Free/Introductory Offer': 'Accepted the ₹99 introductory rate which automatically transitions to a recurring ₹499 monthly charge unless cancelled.',
        'Choose Monthly Subscription': 'Opted for standard month-to-month commitment (₹499/mo) with standard cancellation terms.',
        'Do Not Subscribe': 'Declined all recurring commitments, prioritizing cost avoidance over premium service access.'
      }
    };

    taskList.forEach(item => {
      const t = appState.tasks[item.key];
      const card = document.createElement('div');
      card.className = 'analysis-card';
      const interpText = (interpretations[item.key] && interpretations[item.key][t.finalSelection])
        ? interpretations[item.key][t.finalSelection]
        : 'Participant confirmed decision within standard parameters.';

      card.innerHTML = `
        <div class="analysis-header">
          <h4>${item.name}</h4>
          <span class="analysis-timing">Decision Time: <strong>${formatSeconds(t.decisionTimeSec)}</strong> | Total: <strong>${formatSeconds(t.totalTimeSec)}</strong></span>
        </div>
        <div class="analysis-choice">
          <strong>Chosen Decision:</strong> ${escapeHtml(t.finalSelection || 'Not recorded')}
          ${t.selectionChanges > 0 ? ` <em>(Changed decision ${t.selectionChanges} time(s))</em>` : ''}
        </div>
        <div class="analysis-interp">
          <strong>Contextual Observation:</strong> ${interpText}
        </div>
      `;
      taskAnalysesDiv.appendChild(card);
    });

    // D. Behavioural Summary
    const avgDecTime = totalDecTime / 3;
    document.getElementById('rep-total-dec-time').textContent = formatSeconds(totalDecTime);
    document.getElementById('rep-avg-dec-time').textContent = formatSeconds(avgDecTime);
    document.getElementById('rep-dec-changed').textContent = `${totalChanges} of 3 tasks`;
    document.getElementById('rep-countdowns-done').textContent =
      appState.assignedCondition === 'Experimental' ? `${countdownsDone} of 3` : 'N/A (Control Group)';

    // Task 2 permission observation
    const permChoice = appState.tasks.task2.finalSelection;
    let permSummary = 'Restricted / Denied';
    if (permChoice === 'Allow All Permissions') {
      permSummary = 'All (Broad Sharing)';
    } else if (permChoice === 'Allow Only Essential Permissions') {
      permSummary = 'Essential Only (Selective)';
    }
    document.getElementById('rep-privacy-stat').textContent = permSummary;

    // Task 3 auto-renewal observation
    const subChoice = appState.tasks.task3.finalSelection;
    const autoRenewAccepted = (subChoice === 'Start Free/Introductory Offer' || subChoice === 'Choose Monthly Subscription') ? 'Yes (Recurring)' : 'No (Declined)';
    document.getElementById('rep-autorenew-stat').textContent = autoRenewAccepted;

    // E. Questionnaire Results (from form.pdf)
    const surveyBox = document.getElementById('rep-survey-results');
    const q = appState.questionnaire;
    surveyBox.innerHTML = `
      <div style="margin-bottom: 0.85rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--border-color);">
        <strong style="color: var(--primary); font-size: 0.9rem;">Task 1 Evaluation (Shopping)</strong>
        <div class="survey-res-item"><span class="survey-res-q">Recall (ANC Product B Price):</span><span class="survey-res-a">${escapeHtml(q.t1_recall || '-')}</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Consequence (Product A Trade-off):</span><span class="survey-res-a">${escapeHtml(q.t1_consequence || '-')}</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Decision Confidence (1-7):</span><span class="survey-res-a">${escapeHtml(q.t1_confidence || '-')}/7</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Frustration Level (1-7):</span><span class="survey-res-a">${escapeHtml(q.t1_frustration || '-')}/7</span></div>
      </div>

      <div style="margin-bottom: 0.85rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--border-color);">
        <strong style="color: var(--primary); font-size: 0.9rem;">Task 2 Evaluation (Permissions & Privacy)</strong>
        <div class="survey-res-item"><span class="survey-res-q">Recall (Requested Permissions):</span><span class="survey-res-a">${escapeHtml(q.t2_recall || '-')}</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Consequence (Disclosure Consequence):</span><span class="survey-res-a">${escapeHtml(q.t2_consequence || '-')}</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Decision Confidence (1-7):</span><span class="survey-res-a">${escapeHtml(q.t2_confidence || '-')}/7</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Frustration Level (1-7):</span><span class="survey-res-a">${escapeHtml(q.t2_frustration || '-')}/7</span></div>
      </div>

      <div style="margin-bottom: 0.85rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--border-color);">
        <strong style="color: var(--primary); font-size: 0.9rem;">Task 3 Evaluation (Subscription Auto-Renewal)</strong>
        <div class="survey-res-item"><span class="survey-res-q">Recall (Regular Monthly Price):</span><span class="survey-res-a">${escapeHtml(q.t3_recall || '-')}</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Consequence (Cancellation Action Required):</span><span class="survey-res-a">${escapeHtml(q.t3_consequence || '-')}</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Decision Confidence (1-7):</span><span class="survey-res-a">${escapeHtml(q.t3_confidence || '-')}/7</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Frustration Level (1-7):</span><span class="survey-res-a">${escapeHtml(q.t3_frustration || '-')}/7</span></div>
      </div>

      <div>
        <strong style="color: var(--primary); font-size: 0.9rem;">Post-Study Reflection & Habits</strong>
        <div class="survey-res-item"><span class="survey-res-q">Decision Regret (1-7):</span><span class="survey-res-a">${escapeHtml(q.post_regret || '-')}/7</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Felt Rushed (1-5):</span><span class="survey-res-a">${escapeHtml(q.post_rushed || '-')}/5</span></div>
        <div class="survey-res-item"><span class="survey-res-q">E-commerce Frequency:</span><span class="survey-res-a">${escapeHtml(q.post_ecommerce_freq || '-')}</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Impulsive Clicking Habits (1-7):</span><span class="survey-res-a">${escapeHtml(q.post_impulsive_click || '-')}/7</span></div>
        <div class="survey-res-item"><span class="survey-res-q">Prior Speed vs Privacy/Money Preference:</span><span class="survey-res-a">${escapeHtml(q.post_prior_pref || '-')}</span></div>
        ${q.post_feedback ? `
          <div class="survey-res-item" style="flex-direction: column; align-items: flex-start; gap: 0.35rem;">
            <span class="survey-res-q"><strong>Participant Feedback:</strong></span>
            <span style="font-size: 0.85rem; color: #334155;">${escapeHtml(q.post_feedback)}</span>
          </div>
        ` : ''}
      </div>
    `;

    // F. Final Participant Summary Synthesis (Neutral, strictly observational)
    const summaryBox = document.getElementById('rep-participant-summary');
    const conditionText = appState.assignedCondition === 'Experimental'
      ? `under the experimental condition featuring an imposed ${appState.configuredPauseDuration}-second decision pause`
      : `under the control condition with immediate confirmation capability`;

    const changeDescription = totalChanges > 0
      ? `The participant modified their selection ${totalChanges} time(s) prior to confirmation.`
      : `The participant confirmed their initial choice in all scenarios without revising selections.`;

    const privacyDescription = permChoice === 'Allow All Permissions'
      ? `In the privacy scenario, the participant accepted all requested permissions including background tracking.`
      : (permChoice === 'Allow Only Essential Permissions'
        ? `In the privacy scenario, the participant opted for essential permissions, limiting background data sharing.`
        : `In the privacy scenario, the participant withheld permissions.`);

    const subDescription = (subChoice === 'Start Free/Introductory Offer')
      ? `In the subscription scenario, the participant chose the introductory trial with recurring automatic renewal obligations.`
      : (subChoice === 'Choose Monthly Subscription'
        ? `In the subscription scenario, the participant chose the monthly subscription plan.`
        : `In the subscription scenario, the participant declined subscription terms.`);

    summaryBox.innerHTML = `
      <p>
        Participant <strong>${escapeHtml(appState.participantId)}</strong> completed all three decision tasks ${conditionText}.
        The average decision time per task was <strong>${formatSeconds(avgDecTime)}</strong> (total decision time: ${formatSeconds(totalDecTime)}).
      </p>
      <p style="margin-top: 0.6rem;">
        ${changeDescription} ${privacyDescription} ${subDescription}
      </p>
      <p style="margin-top: 0.6rem; font-size: 0.825rem; color: #475569;">
        <em>Note: This behavioral observation is descriptive and does not represent a psychological diagnosis.</em>
      </p>
    `;
  }

  // --- CSV Export Generation ---
  function exportCSV(singleSessionOnly = true) {
    let dataset = [];
    if (singleSessionOnly) {
      dataset = [appState];
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.ALL_SESSIONS_LOG);
        dataset = raw ? JSON.parse(raw) : [appState];
      } catch (e) {
        dataset = [appState];
      }
    }

    const headers = [
      'Participant_ID',
      'Assigned_Condition',
      'Pause_Duration_Sec',
      'Task_Key',
      'Task_Title',
      'Initial_Selection',
      'Final_Selection',
      'Changed_Selection',
      'Selection_Changes_Count',
      'First_Selection_Time_Sec',
      'Decision_Time_Sec',
      'Total_Task_Time_Sec',
      'Countdown_Completed',
      // form.pdf fields
      'T1_Recall',
      'T1_Consequence',
      'T1_Confidence_1to7',
      'T1_Frustration_1to7',
      'T2_Recall',
      'T2_Consequence',
      'T2_Confidence_1to7',
      'T2_Frustration_1to7',
      'T3_Recall',
      'T3_Consequence',
      'T3_Confidence_1to7',
      'T3_Frustration_1to7',
      'Post_Regret_1to7',
      'Post_Rushed_1to5',
      'Post_Ecommerce_Freq',
      'Post_Impulsive_Click_1to7',
      'Post_Prior_Pref',
      'Post_Feedback'
    ];

    const rows = [];
    rows.push(headers.join(','));

    dataset.forEach(session => {
      const pid = session.participantId || 'UNKNOWN';
      const cond = session.assignedCondition || 'UNKNOWN';
      const pauseSec = session.configuredPauseDuration || 0;
      const q = session.questionnaire || {};

      ['task1', 'task2', 'task3'].forEach(taskKey => {
        const t = (session.tasks && session.tasks[taskKey]) ? session.tasks[taskKey] : {};
        const changed = (t.initialSelection !== t.finalSelection || t.selectionChanges > 0) ? 'YES' : 'NO';
        const firstSelSec = t.firstSelectionTime && t.taskStartTime ? ((t.firstSelectionTime - t.taskStartTime) / 1000).toFixed(2) : '0';

        const row = [
          csvSafe(pid),
          csvSafe(cond),
          pauseSec,
          csvSafe(taskKey),
          csvSafe(t.title || taskKey),
          csvSafe(t.initialSelection || ''),
          csvSafe(t.finalSelection || ''),
          changed,
          t.selectionChanges || 0,
          firstSelSec,
          (t.decisionTimeSec || 0).toFixed(2),
          (t.totalTimeSec || 0).toFixed(2),
          t.countdownCompleted ? 'YES' : 'NO',
          // form.pdf fields
          csvSafe(q.t1_recall || ''),
          csvSafe(q.t1_consequence || ''),
          csvSafe(q.t1_confidence || ''),
          csvSafe(q.t1_frustration || ''),
          csvSafe(q.t2_recall || ''),
          csvSafe(q.t2_consequence || ''),
          csvSafe(q.t2_confidence || ''),
          csvSafe(q.t2_frustration || ''),
          csvSafe(q.t3_recall || ''),
          csvSafe(q.t3_consequence || ''),
          csvSafe(q.t3_confidence || ''),
          csvSafe(q.t3_frustration || ''),
          csvSafe(q.post_regret || ''),
          csvSafe(q.post_rushed || ''),
          csvSafe(q.post_ecommerce_freq || ''),
          csvSafe(q.post_impulsive_click || ''),
          csvSafe(q.post_prior_pref || ''),
          csvSafe(q.post_feedback || '')
        ];
        rows.push(row.join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const fileName = singleSessionOnly
      ? `experiment_${appState.participantId || 'session'}.csv`
      : `all_experiment_sessions_${Date.now()}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function csvSafe(str) {
    if (str === null || str === undefined) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Restart Experiment / Next Study ---
  async function restartExperiment() {
    // Only attempt sync before clearing session if it wasn't already synced
    if (appState.participantId && appState.experimentEndTime && !appState.hasSyncedToMaster) {
      const allSessions = archiveSession();
      try {
        await syncParticipantToMasterCSV(allSessions);
        appState.hasSyncedToMaster = true;
      } catch (err) {
        console.warn('Sync error before restart:', err);
      }
    }

    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    if (appState.timer.intervalId) {
      clearInterval(appState.timer.intervalId);
    }
    location.reload();
  }

  // --- Researcher Settings Modal Controller ---
  const modalAdmin = document.getElementById('modal-admin');
  const btnAdmin = document.getElementById('btn-admin-config');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const cfgPauseInput = document.getElementById('cfg-pause-duration');
  const cfgOverrideSelect = document.getElementById('cfg-condition-override');
  const adminStorageInfo = document.getElementById('admin-storage-info');
  const btnExportAll = document.getElementById('btn-export-all-data');
  const btnClearAll = document.getElementById('btn-clear-all-data');

  function openResearcherModal() {
    const config = getResearcherConfig();
    cfgPauseInput.value = config.pauseDuration !== undefined ? config.pauseDuration : 10;
    cfgOverrideSelect.value = config.assignmentMode || 'random';

    const applyAllInput = document.getElementById('cfg-apply-all');
    const perTaskContainer = document.getElementById('cfg-per-task-container');
    if (applyAllInput) {
      applyAllInput.checked = config.applyAllTasks !== false;
      if (perTaskContainer) {
        perTaskContainer.style.display = applyAllInput.checked ? 'none' : 'block';
      }
    }

    const tDur = config.taskDurations || { task1: 10, task2: 10, task3: 10 };
    const t1Input = document.getElementById('cfg-pause-task1');
    const t2Input = document.getElementById('cfg-pause-task2');
    const t3Input = document.getElementById('cfg-pause-task3');
    if (t1Input) t1Input.value = tDur.task1 !== undefined ? tDur.task1 : 10;
    if (t2Input) t2Input.value = tDur.task2 !== undefined ? tDur.task2 : 10;
    if (t3Input) t3Input.value = tDur.task3 !== undefined ? tDur.task3 : 10;

    const sbUrlInput = document.getElementById('cfg-supabase-url');
    const sbKeyInput = document.getElementById('cfg-supabase-key');
    const sbTableInput = document.getElementById('cfg-supabase-table');
    if (sbUrlInput) sbUrlInput.value = config.supabaseUrl || '';
    if (sbKeyInput) sbKeyInput.value = config.supabaseKey || '';
    if (sbTableInput) sbTableInput.value = config.supabaseTable || 'experiment_responses';

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ALL_SESSIONS_LOG);
      const list = raw ? JSON.parse(raw) : [];
      adminStorageInfo.textContent = `Stored local participant sessions: ${list.length}`;
    } catch (e) {
      adminStorageInfo.textContent = 'Storage unavailable';
    }

    modalAdmin.style.display = 'flex';
  }

  function closeResearcherModal() {
    modalAdmin.style.display = 'none';
  }

  function saveResearcherSettings() {
    const pauseVal = isNaN(parseInt(cfgPauseInput.value, 10)) ? 10 : Math.max(0, parseInt(cfgPauseInput.value, 10));
    const assignVal = cfgOverrideSelect.value;
    const sbUrlInput = document.getElementById('cfg-supabase-url');
    const sbKeyInput = document.getElementById('cfg-supabase-key');
    const sbTableInput = document.getElementById('cfg-supabase-table');
    const applyAllInput = document.getElementById('cfg-apply-all');
    const isApplyAll = applyAllInput ? applyAllInput.checked : true;

    const t1Input = document.getElementById('cfg-pause-task1');
    const t2Input = document.getElementById('cfg-pause-task2');
    const t3Input = document.getElementById('cfg-pause-task3');

    const t1Val = isApplyAll ? pauseVal : (isNaN(parseInt(t1Input?.value, 10)) ? pauseVal : Math.max(0, parseInt(t1Input.value, 10)));
    const t2Val = isApplyAll ? pauseVal : (isNaN(parseInt(t2Input?.value, 10)) ? pauseVal : Math.max(0, parseInt(t2Input.value, 10)));
    const t3Val = isApplyAll ? pauseVal : (isNaN(parseInt(t3Input?.value, 10)) ? pauseVal : Math.max(0, parseInt(t3Input.value, 10)));

    const newConfig = {
      pauseDuration: pauseVal,
      assignmentMode: assignVal,
      applyAllTasks: isApplyAll,
      taskDurations: {
        task1: t1Val,
        task2: t2Val,
        task3: t3Val
      },
      supabaseUrl: sbUrlInput ? sbUrlInput.value.trim() : '',
      supabaseKey: sbKeyInput ? sbKeyInput.value.trim() : '',
      supabaseTable: sbTableInput ? sbTableInput.value.trim() : 'experiment_responses'
    };
    saveResearcherConfig(newConfig);

    // Apply IMMEDIATELY to active session so user sees changes right away
    appState.configuredPauseDuration = pauseVal;
    appState.taskDurations = newConfig.taskDurations;
    if (assignVal !== 'random') {
      appState.assignedCondition = assignVal === 'experimental' ? 'Experimental' : 'Control';
    }
    persistSession();

    // If currently on an active task screen, immediately restart that screen with the new duration!
    if (['task1', 'task2', 'task3'].includes(appState.currentScreen)) {
      const task = appState.tasks[appState.currentScreen];
      task.countdownCompleted = false;
      appState.timer.active = false;
      appState.timer.targetTime = null;
      if (appState.timer.intervalId) {
        clearInterval(appState.timer.intervalId);
        appState.timer.intervalId = null;
      }
      initTaskScreen(appState.currentScreen);
    }

    alert(`Settings saved!\nPause Duration: ${pauseVal}s (T1: ${t1Val}s, T2: ${t2Val}s, T3: ${t3Val}s)\nCondition: ${assignVal}`);
    closeResearcherModal();
  }

  async function testSupabaseConnection() {
    const sbUrlInput = document.getElementById('cfg-supabase-url');
    const sbKeyInput = document.getElementById('cfg-supabase-key');
    const sbTableInput = document.getElementById('cfg-supabase-table');

    const url = (sbUrlInput ? sbUrlInput.value.trim() : '');
    const key = (sbKeyInput ? sbKeyInput.value.trim() : '');
    const table = (sbTableInput ? sbTableInput.value.trim() : 'experiment_responses') || 'experiment_responses';

    if (!url || !key) {
      alert('Please enter your Supabase Project URL and Anon/Public Key first.');
      return;
    }

    try {
      const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/${table}?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      if (res.ok) {
        alert(`⚡ Connected to Supabase successfully!\nTable '${table}' is active and ready to record participant responses.`);
      } else {
        const errText = await res.text();
        alert(`Supabase Connection Status (${res.status}):\n${errText}\n\nTip: Make sure table '${table}' exists in your Supabase database and Row Level Security (RLS) allows anon read/insert.`);
      }
    } catch (err) {
      alert(`Network error connecting to Supabase: ${err.message}`);
    }
  }

  // Preset buttons in modal
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.getAttribute('data-sec');
      cfgPauseInput.value = sec;
      const t1Input = document.getElementById('cfg-pause-task1');
      const t2Input = document.getElementById('cfg-pause-task2');
      const t3Input = document.getElementById('cfg-pause-task3');
      if (t1Input) t1Input.value = sec;
      if (t2Input) t2Input.value = sec;
      if (t3Input) t3Input.value = sec;
    });
  });

  const applyAllCheckbox = document.getElementById('cfg-apply-all');
  if (applyAllCheckbox) {
    applyAllCheckbox.addEventListener('change', () => {
      const perTaskContainer = document.getElementById('cfg-per-task-container');
      if (perTaskContainer) {
        perTaskContainer.style.display = applyAllCheckbox.checked ? 'none' : 'block';
      }
    });
  }

  // --- Event Binding ---
  function initEventListeners() {
    // Welcome screen begin
    document.getElementById('btn-start-welcome').addEventListener('click', () => {
      showScreen('instructions');
    });

    // Instructions screen proceed
    document.getElementById('btn-proceed-instructions').addEventListener('click', () => {
      initializeParticipantSession();
    });

    // Card selection delegation
    document.addEventListener('click', handleOptionSelect);

    // Confirmation buttons
    document.getElementById('btn-confirm-task-1').addEventListener('click', () => handleTaskConfirm('task1'));
    document.getElementById('btn-confirm-task-2').addEventListener('click', () => handleTaskConfirm('task2'));
    document.getElementById('btn-confirm-task-3').addEventListener('click', () => handleTaskConfirm('task3'));

    // Questionnaire form submit
    document.getElementById('form-questionnaire').addEventListener('submit', handleSurveySubmit);

    // Export & Restart buttons
    document.getElementById('btn-export-pdf').addEventListener('click', () => window.print());
    document.getElementById('btn-export-csv').addEventListener('click', () => exportCSV(false));
    document.getElementById('btn-export-csv-bottom').addEventListener('click', () => exportCSV(false));
    document.getElementById('btn-restart').addEventListener('click', restartExperiment);
    document.getElementById('btn-restart-bottom').addEventListener('click', restartExperiment);

    const btnNextPart = document.getElementById('btn-next-participant');
    if (btnNextPart) {
      btnNextPart.addEventListener('click', restartExperiment);
    }

    // Researcher modal
    btnAdmin.addEventListener('click', openResearcherModal);
    btnCloseModal.addEventListener('click', closeResearcherModal);
    btnSaveSettings.addEventListener('click', saveResearcherSettings);
    modalAdmin.addEventListener('click', (e) => {
      if (e.target === modalAdmin) closeResearcherModal();
    });

    btnExportAll.addEventListener('click', () => exportCSV(false));
    const btnTestSb = document.getElementById('btn-test-supabase');
    if (btnTestSb) btnTestSb.addEventListener('click', testSupabaseConnection);
    btnClearAll.addEventListener('click', () => {
      if (confirm('Clear all stored session logs from this browser?')) {
        localStorage.removeItem(STORAGE_KEYS.ALL_SESSIONS_LOG);
        adminStorageInfo.textContent = 'Stored local participant sessions: 0';
      }
    });
  }

  // --- Bootstrap on Load ---
  function initApp() {
    initEventListeners();

    // Check if session was active before reload
    const hasSession = restoreSession();
    if (hasSession && appState.currentScreen && screens[appState.currentScreen]) {
      showScreen(appState.currentScreen);
    } else {
      showScreen('welcome');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

