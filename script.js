/*
 * CardioQuest ECG Quiz
 *
 * A lightweight single‑page quiz application implemented in vanilla JavaScript.
 * It provides arcade, exam and daily challenge modes, a local leaderboard,
 * category filtering, hints, basic settings and a simple profile screen.
 * Data persists in localStorage so users can revisit and track their progress.
 */

(function () {
  // Optional Supabase integration for a cloud-based leaderboard.  To enable,
  // provide your Supabase project URL and public anonymous API key below.
  // See https://supabase.com/docs for instructions on setting up a table
  // called "leaderboard" with fields matching the exam results (date, name,
  // role, type, score, total, percent).  Without valid values, the app
  // gracefully falls back to a purely local leaderboard.
  const SUPABASE_URL = '';
  const SUPABASE_ANON_KEY = '';
  let supabaseClient = null;
  if (typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  // Define all possible categories. These correspond to high‑level ECG themes.
  const CATEGORIES = ['arrhythmia', 'conduction', 'ischemia', 'metabolic', 'pericardial'];

  // Question bank: each question contains a prompt, multiple choice answers,
  // the index of the correct answer, a category and a short explanation.
  const QUESTIONS = [
    {
      id: 1,
      category: 'arrhythmia',
      question: 'This ECG shows an irregularly irregular rhythm with absent P waves. What is the arrhythmia?',
      options: [
        'Atrial flutter',
        'Atrial fibrillation',
        'Sinus tachycardia',
        'AV nodal reentrant tachycardia'
      ],
      correctIndex: 1,
      explanation: 'Atrial fibrillation is characterized by an irregularly irregular rhythm and absence of discernible P waves.'
      ,
      image: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/ECG_Atrial_Fibrillation.jpg/640px-ECG_Atrial_Fibrillation.jpg',
        credit: 'J. Heuser – Atrial fibrillation diagram (CC BY‑SA 3.0) via Wikimedia Commons'
      }
    },
    {
      id: 2,
      category: 'arrhythmia',
      question: 'A regular narrow‑complex tachycardia with sudden onset and termination suggests which rhythm?',
      options: [
        'Sinus tachycardia',
        'Atrial fibrillation',
        'AV nodal reentrant tachycardia',
        'Ventricular tachycardia'
      ],
      correctIndex: 2,
      explanation: 'AV nodal reentrant tachycardia (AVNRT) presents with sudden onset/offset and a regular narrow QRS complex.'
    },
    {
      id: 3,
      category: 'conduction',
      question: 'The PR interval progressively lengthens until a beat is dropped. Which conduction abnormality is this?',
      options: [
        'First‑degree AV block',
        'Second‑degree AV block Mobitz I (Wenckebach)',
        'Second‑degree AV block Mobitz II',
        'Third‑degree AV block'
      ],
      correctIndex: 1,
      explanation: 'Mobitz I (Wenckebach) shows progressively prolonged PR intervals culminating in a nonconducted P wave.'
    },
    {
      id: 4,
      category: 'conduction',
      question: 'A constant PR interval with intermittent non‑conducted P waves indicates which block?',
      options: [
        'Second‑degree AV block Mobitz II',
        'Second‑degree AV block Mobitz I',
        'Third‑degree AV block',
        'First‑degree AV block'
      ],
      correctIndex: 0,
      explanation: 'Mobitz II is characterized by fixed PR intervals with occasional dropped beats without prior lengthening.'
    },
    {
      id: 5,
      category: 'conduction',
      question: 'A prolonged QRS (>120 ms) with an RSR′ pattern in V1 and a wide S wave in V6 suggests:',
      options: [
        'Left bundle branch block',
        'Right bundle branch block',
        'First‑degree AV block',
        'Ventricular paced rhythm'
      ],
      correctIndex: 1,
      explanation: 'Right bundle branch block (RBBB) shows an RSR′ complex in V1 and a broad S wave in the lateral leads.'
    },
    {
      id: 6,
      category: 'conduction',
      question: 'Broad, notched R waves in leads I and V6 with deep S waves in V1 and V2 are typical of which condition?',
      options: [
        'Right bundle branch block',
        'Left bundle branch block',
        'Left anterior fascicular block',
        'Hyperkalemia'
      ],
      correctIndex: 1,
      explanation: 'Left bundle branch block (LBBB) produces a broad or notched R wave in I/V6 and a deep S wave in V1.'
    },
    {
      id: 7,
      category: 'ischemia',
      question: 'ST‑segment elevation in leads II, III and aVF most strongly suggests which territory infarction?',
      options: [
        'Anterior myocardial infarction',
        'Inferior myocardial infarction',
        'Lateral myocardial infarction',
        'Posterior myocardial infarction'
      ],
      correctIndex: 1,
      explanation: 'Elevation in II, III and aVF indicates an inferior infarction, often due to right coronary artery occlusion.'
    },
    {
      id: 8,
      category: 'ischemia',
      question: 'Deep ST‑segment depressions in V1–V4 accompanied by tall R waves may indicate which phenomenon?',
      options: [
        'Posterior myocardial infarction',
        'Pericarditis',
        'Left ventricular hypertrophy',
        'Hyperkalemia'
      ],
      correctIndex: 0,
      explanation: 'Posterior MI manifests as ST depression and tall R waves in the anterior leads (mirror image of ST elevation).'
    },
    {
      id: 9,
      category: 'ischemia',
      question: 'ST‑segment elevation in V2–V4 with reciprocal changes in the inferior leads is typical of:',
      options: [
        'Anterior myocardial infarction',
        'Inferior myocardial infarction',
        'Brugada syndrome',
        'Early repolarization'
      ],
      correctIndex: 0,
      explanation: 'Elevation in the anterior precordial leads (V2–V4) with inferior reciprocal depression indicates an anterior MI.'
    },
    {
      id: 10,
      category: 'metabolic',
      question: 'Peaked T waves with a widened QRS complex are most consistent with which electrolyte disturbance?',
      options: [
        'Hypokalemia',
        'Hyperkalemia',
        'Hypocalcemia',
        'Hypernatremia'
      ],
      correctIndex: 1,
      explanation: 'Hyperkalemia produces tall peaked T waves, widening of the QRS and eventual sine‑wave pattern.'
    },
    {
      id: 11,
      category: 'metabolic',
      question: 'A prolonged QT interval is often associated with which metabolic disturbance?',
      options: [
        'Hypocalcemia',
        'Hyperkalemia',
        'Hypercalcemia',
        'Hypermagnesemia'
      ],
      correctIndex: 0,
      explanation: 'Hypocalcemia lengthens the QT interval, reflecting prolonged ventricular repolarization.'
    },
    {
      id: 12,
      category: 'pericardial',
      question: 'Diffuse ST‑segment elevation and PR depression across multiple leads are characteristic of:',
      options: [
        'Early repolarization',
        'Acute pericarditis',
        'Inferior myocardial infarction',
        'Brugada syndrome'
      ],
      correctIndex: 1,
      explanation: 'Acute pericarditis produces widespread concave ST elevation with PR segment depression.'
    },
    {
      id: 13,
      category: 'arrhythmia',
      question: 'Sawtooth flutter waves at roughly 300 bpm and a ventricular response of 150 bpm suggest:',
      options: [
        'Atrial flutter with 2:1 block',
        'Atrial fibrillation',
        'Torsades de pointes',
        'Ventricular tachycardia'
      ],
      correctIndex: 0,
      explanation: 'Atrial flutter produces sawtooth F waves; 2:1 conduction results in a ventricular rate near 150 bpm.'
    },
    {
      id: 14,
      category: 'metabolic',
      question: 'A shortened QT interval is most consistent with which condition?',
      options: [
        'Hypocalcemia',
        'Hypercalcemia',
        'Hypokalemia',
        'Hypermagnesemia'
      ],
      correctIndex: 1,
      explanation: 'Hypercalcemia reduces the duration of ventricular repolarization, shortening the QT interval.'
    },
    {
      id: 15,
      category: 'conduction',
      question: 'There is no relationship between P waves and QRS complexes—each marches to its own rhythm. This describes:',
      options: [
        'First‑degree AV block',
        'Second‑degree AV block Mobitz I',
        'Second‑degree AV block Mobitz II',
        'Third‑degree (complete) AV block'
      ],
      correctIndex: 3,
      explanation: 'In complete heart block there is AV dissociation: atria and ventricles beat independently.'
    },
    {
      id: 16,
      category: 'ischemia',
      question: 'Coved ST elevation in V1–V3 with a right bundle branch block pattern suggests:',
      options: [
        'Early repolarization',
        'Brugada syndrome',
        'Anterior myocardial infarction',
        'Posterior myocardial infarction'
      ],
      correctIndex: 1,
      explanation: 'Brugada syndrome shows coved or saddleback ST elevation in the right precordial leads with a pseudo‑RBBB.'
    },
    {
      id: 17,
      category: 'pericardial',
      question: 'Electrical alternans with low voltage QRS complexes indicates:',
      options: [
        'Pericardial tamponade',
        'Hyperkalemia',
        'Atrial fibrillation',
        'STEMI'
      ],
      correctIndex: 0,
      explanation: 'Swinging of the heart in a fluid‑filled sac leads to electrical alternans and low voltage in tamponade.'
    },
    {
      id: 18,
      category: 'arrhythmia',
      question: 'A short PR interval with a delta wave (slurred upstroke of QRS) and recurrent tachycardia suggests:',
      options: [
        'Atrial flutter',
        'Wolff‑Parkinson‑White syndrome',
        'Sinus tachycardia',
        'AV nodal reentrant tachycardia'
      ],
      correctIndex: 1,
      explanation: 'WPW is characterized by an accessory pathway causing a delta wave and predisposition to AVRT.'
    },
    {
      id: 19,
      category: 'metabolic',
      question: 'Prominent U waves with flattened T waves are seen in which disorder?',
      options: [
        'Hyperkalemia',
        'Hypokalemia',
        'Hypercalcemia',
        'Hypomagnesemia'
      ],
      correctIndex: 1,
      explanation: 'Hypokalemia leads to flattened or inverted T waves and the appearance of prominent U waves.'
    },
    {
      id: 20,
      category: 'ischemia',
      question: 'Deeply inverted or biphasic T waves in V2–V3 during pain‑free periods may signify:',
      options: [
        'Wellens syndrome',
        'Brugada syndrome',
        'Left ventricular hypertrophy',
        'Hyperkalemia'
      ],
      correctIndex: 0,
      explanation: 'Wellens syndrome is a pattern of deep T wave inversion or biphasic waves in anterior leads indicating critical LAD stenosis.'
    }
  ];

  // Global application state. This object is mutated throughout the quiz.
  const state = {
    view: 'home',        // current screen: home, quizArcade, quizExam, quizDaily, leaderboard, settings, profile, result
    user: { name: 'Player', role: 'Student' },
    settings: { examSize: 20, timePerQ: 30 },
    selectedCategories: CATEGORIES.slice(),
    currentQuestions: [],
    currentIndex: 0,
    score: 0,
    timer: null,
    timeLeft: 0,
    hintUsed: false,
    answers: [],
    quizType: '',        // 'arcade', 'exam', 'daily'
    leaderboard: []
  };

  /**
   * Initialize the application by loading persisted data and rendering the home screen.
   */
  async function init() {
    // Load user info
    const savedUser = localStorage.getItem('ecgQuizUser');
    if (savedUser) {
      try { state.user = JSON.parse(savedUser); } catch (e) { /* ignore */ }
    }
    // Load settings
    const savedSettings = localStorage.getItem('ecgQuizSettings');
    if (savedSettings) {
      try { state.settings = JSON.parse(savedSettings); } catch (e) { /* ignore */ }
    }
    // Load leaderboard
    const savedLeaderboard = localStorage.getItem('ecgQuizLeaderboard');
    if (savedLeaderboard) {
      try { state.leaderboard = JSON.parse(savedLeaderboard); } catch (e) { /* ignore */ }
    }
    // If Supabase is configured, fetch the cloud leaderboard and overwrite local copy
    if (supabaseClient) {
      await fetchCloudLeaderboard();
    }
    // Start at home view
    state.view = 'home';
    render();
  }

  /**
   * Persist user information to localStorage.
   */
  function saveUser() {
    localStorage.setItem('ecgQuizUser', JSON.stringify(state.user));
  }

  /**
   * Persist settings to localStorage.
   */
  function saveSettings() {
    localStorage.setItem('ecgQuizSettings', JSON.stringify(state.settings));
  }

  /**
   * Persist leaderboard to localStorage.
   */
  function saveLeaderboard() {
    localStorage.setItem('ecgQuizLeaderboard', JSON.stringify(state.leaderboard));
  }

  /**
   * If Supabase is configured, insert a leaderboard entry into the remote table.
   * Called after finishing an exam or daily quiz. Errors are logged silently.
   * @param {Object} entry Leaderboard entry to persist remotely.
   */
  async function syncToCloud(entry) {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.from('leaderboard').insert([entry]);
      if (error) {
        console.error('Supabase insert error:', error);
      }
    } catch (e) {
      console.error('Supabase insert failed:', e);
    }
  }

  /**
   * Fetch remote leaderboard from Supabase if configured and merge with local data.
   * This overwrites the local leaderboard with the remote version, sorted
   * descending by percent and score. Use sparingly to minimize network requests.
   */
  async function fetchCloudLeaderboard() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('leaderboard')
        .select('*')
        .order('percent', { ascending: false })
        .order('score', { ascending: false });
      if (!error && data) {
        state.leaderboard = data;
        saveLeaderboard();
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    }
  }

  /**
   * Render the appropriate view based on the current state.
   */
  function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    switch (state.view) {
      case 'home':
        renderHome(app);
        break;
      case 'quizArcade':
      case 'quizExam':
      case 'quizDaily':
        renderQuiz(app);
        break;
      case 'leaderboard':
        renderLeaderboard(app);
        break;
      case 'settings':
        renderSettings(app);
        break;
      case 'profile':
        renderProfile(app);
        break;
      case 'result':
        renderResult(app);
        break;
      default:
        renderHome(app);
    }
  }

  /**
   * Render the home screen with navigation options.
   */
  function renderHome(container) {
    const div = document.createElement('div');
    div.className = 'container';
    // Title and subtitle for the home screen
    const title = document.createElement('h1');
    title.textContent = 'CardioQuest';
    div.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Test your ECG interpretation skills with quizzes and challenges!';
    div.appendChild(subtitle);

    const arcadeBtn = createButton('Arcade Mode', () => {
      state.quizType = 'arcade';
      startArcade();
    });
    const dailyBtn = createButton('Daily Challenge', () => {
      state.quizType = 'daily';
      startDaily();
    });
    const examBtn = createButton('Exam Mode', () => {
      state.quizType = 'exam';
      startExam();
    });
    const lbBtn = createButton('Leaderboard', () => {
      state.view = 'leaderboard';
      render();
    });
    const settingsBtn = createButton('Settings', () => {
      state.view = 'settings';
      render();
    });
    const profileBtn = createButton('Profile', () => {
      state.view = 'profile';
      render();
    });

    div.appendChild(arcadeBtn);
    div.appendChild(dailyBtn);
    div.appendChild(examBtn);
    div.appendChild(lbBtn);
    div.appendChild(settingsBtn);
    div.appendChild(profileBtn);

    // Add legal and patent information at the bottom of the home screen.
    const legal = document.createElement('p');
    legal.style.fontSize = '0.8rem';
    legal.style.marginTop = '1.5rem';
    // Update the legal notice to reflect rights reserved information only
    legal.textContent = 'All rights reserved: HONESTGRACIOSITY – SGPS';
    div.appendChild(legal);

    container.appendChild(div);
  }

  /**
   * Helper to create a button element with a click handler.
   */
  function createButton(label, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  /**
   * Start arcade mode: random quiz from selected categories. Uses settings.examSize for length.
   */
  function startArcade() {
    // Filter questions by selected categories
    const pool = QUESTIONS.filter(q => state.selectedCategories.includes(q.category));
    // Shuffle pool
    const shuffled = shuffleArray(pool);
    // Limit to examSize questions
    const size = Math.min(state.settings.examSize, shuffled.length);
    state.currentQuestions = shuffled.slice(0, size);
    state.currentIndex = 0;
    state.score = 0;
    state.answers = [];
    state.hintUsed = false;
    state.view = 'quizArcade';
    render();
  }

  /**
   * Start exam mode: timed quiz with predetermined length from selected categories.
   */
  function startExam() {
    const pool = QUESTIONS.filter(q => state.selectedCategories.includes(q.category));
    const shuffled = shuffleArray(pool);
    const size = Math.min(state.settings.examSize, shuffled.length);
    state.currentQuestions = shuffled.slice(0, size);
    state.currentIndex = 0;
    state.score = 0;
    state.answers = [];
    state.hintUsed = false;
    state.view = 'quizExam';
    render();
  }

  /**
   * Start daily challenge: seeded shuffle based on today’s date for consistency across users.
   */
  function startDaily() {
    // Determine seed based on local date (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);
    const shuffled = seededShuffle(QUESTIONS, today);
    // Use a fixed number of questions (10) for daily challenge
    const size = Math.min(10, shuffled.length);
    state.currentQuestions = shuffled.slice(0, size);
    state.currentIndex = 0;
    state.score = 0;
    state.answers = [];
    state.hintUsed = false;
    state.view = 'quizDaily';
    render();
  }

  /**
   * Render quiz question for arcade, exam or daily modes.
   */
  function renderQuiz(container) {
    const div = document.createElement('div');
    div.className = 'container';

    // Back button to exit quiz
    const backBtn = createButton('Back', () => {
      if (state.timer) clearInterval(state.timer);
      state.view = 'home';
      render();
    });
    backBtn.classList.add('back-button');
    div.appendChild(backBtn);

    // Display categories filter only in arcade mode
    if (state.view === 'quizArcade') {
      const catDiv = document.createElement('div');
      catDiv.className = 'category-buttons';
      CATEGORIES.forEach(cat => {
        const btn = createButton(cat.charAt(0).toUpperCase() + cat.slice(1), () => {
          toggleCategory(cat);
        });
        if (state.selectedCategories.includes(cat)) btn.classList.add('active');
        catDiv.appendChild(btn);
      });
      div.appendChild(catDiv);
    }

    // Timer for exam and daily modes
    if (state.view === 'quizExam' || state.view === 'quizDaily') {
      const timerDiv = document.createElement('div');
      timerDiv.className = 'timer';
      timerDiv.id = 'timer';
      div.appendChild(timerDiv);
    }

    // Show question number
    const progress = document.createElement('p');
    progress.textContent = `Question ${state.currentIndex + 1} of ${state.currentQuestions.length}`;
    div.appendChild(progress);

    // Current question
    const q = state.currentQuestions[state.currentIndex];
    const card = document.createElement('div');
    card.className = 'question-card';
    const qText = document.createElement('h2');
    qText.textContent = q.question;
    card.appendChild(qText);

    // Explanation area (hidden initially)
    const explanationP = document.createElement('p');
    explanationP.style.display = 'none';
    explanationP.id = 'explanation';

    // Options
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    q.options.forEach((opt, idx) => {
      const optBtn = document.createElement('button');
      optBtn.textContent = opt;
      optBtn.addEventListener('click', () => {
        handleAnswer(idx, optBtn, optionsDiv, explanationP);
      });
      optionsDiv.appendChild(optBtn);
    });

    // Hint button
    const hintBtn = createButton('Use 50/50 Hint', () => {
      useHint(optionsDiv, q.correctIndex);
      hintBtn.disabled = true;
    });
    // Only allow one hint per question
    hintBtn.disabled = state.hintUsed;

    card.appendChild(hintBtn);
    card.appendChild(optionsDiv);
    card.appendChild(explanationP);
    div.appendChild(card);

    container.appendChild(div);

    // Start timer if necessary
    if (state.view === 'quizExam' || state.view === 'quizDaily') {
      startTimer();
    }
  }

  /**
   * Toggle category selection in arcade mode and restart the arcade.
   */
  function toggleCategory(cat) {
    const index = state.selectedCategories.indexOf(cat);
    if (index === -1) {
      state.selectedCategories.push(cat);
    } else {
      state.selectedCategories.splice(index, 1);
    }
    // Ensure at least one category remains selected
    if (state.selectedCategories.length === 0) {
      state.selectedCategories.push(cat);
    }
    startArcade();
  }

  /**
   * Handle a user selecting an answer. Highlights correct and incorrect choices,
   * updates the score and reveals the explanation. Stops the timer in timed modes.
   */
  function handleAnswer(selectedIndex, selectedBtn, optionsDiv, explanationP) {
    const q = state.currentQuestions[state.currentIndex];
    // Prevent multiple answers
    if (state.answers[state.currentIndex]) return;
    // Stop timer if running
    if (state.timer) clearInterval(state.timer);
    state.answers[state.currentIndex] = selectedIndex;
    // Mark options
    Array.from(optionsDiv.children).forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) {
        btn.classList.add('correct');
      }
      if (idx === selectedIndex && idx !== q.correctIndex) {
        btn.classList.add('wrong');
      }
    });
    // Update score
    if (selectedIndex === q.correctIndex) {
      state.score++;
    }
    // Reveal explanation
    explanationP.textContent = q.explanation;
    explanationP.style.display = 'block';
    // Show next button
    const nextBtn = createButton(
      state.currentIndex + 1 === state.currentQuestions.length ? 'Finish' : 'Next',
      () => {
        state.currentIndex++;
        if (state.currentIndex < state.currentQuestions.length) {
          state.hintUsed = false;
          render();
        } else {
          finishQuiz();
        }
      }
    );
    optionsDiv.parentNode.appendChild(nextBtn);
  }

  /**
   * Provide a 50/50 hint by disabling two incorrect options.
   */
  function useHint(optionsDiv, correctIndex) {
    if (state.hintUsed) return;
    state.hintUsed = true;
    // Collect indices of incorrect options
    const wrongIndices = [];
    Array.from(optionsDiv.children).forEach((btn, idx) => {
      if (idx !== correctIndex) wrongIndices.push(idx);
    });
    // Randomly remove two wrong options
    shuffleArray(wrongIndices).slice(0, 2).forEach(idx => {
      const btn = optionsDiv.children[idx];
      btn.disabled = true;
      btn.style.visibility = 'hidden';
    });
  }

  /**
   * Finish the quiz, record results (if exam/daily) and show summary.
   */
  function finishQuiz() {
    const total = state.currentQuestions.length;
    const score = state.score;
    const percent = Math.round((score / total) * 100);
    // Record to leaderboard for exam and daily
    if (state.quizType === 'exam' || state.quizType === 'daily') {
      const entry = {
        date: new Date().toLocaleDateString(),
        name: state.user.name,
        role: state.user.role,
        type: state.quizType,
        score,
        total,
        percent
      };
      state.leaderboard.push(entry);
      // Sort descending by percent then score
      state.leaderboard.sort((a, b) => b.percent - a.percent || b.score - a.score);
      saveLeaderboard();
      // Attempt to synchronise with the remote Supabase table
      syncToCloud(entry);
    }
    // Transition to result view
    state.view = 'result';
    // Store last result details on state for display
    state.lastResult = { score, total, percent, type: state.quizType };
    render();
  }

  /**
   * Render the result summary after completing a quiz.
   */
  function renderResult(container) {
    const div = document.createElement('div');
    div.className = 'container';
    const { score, total, percent, type } = state.lastResult;
    const header = document.createElement('h2');
    header.textContent = 'Quiz Complete';
    div.appendChild(header);
    const p = document.createElement('p');
    p.textContent = `You scored ${score} out of ${total} (${percent}%).`;
    div.appendChild(p);
    if (type === 'exam' || type === 'daily') {
      const msg = document.createElement('p');
      msg.textContent = 'Your result has been recorded on the leaderboard.';
      div.appendChild(msg);
    }
    const homeBtn = createButton('Return Home', () => {
      state.view = 'home';
      render();
    });
    div.appendChild(homeBtn);
    container.appendChild(div);
  }

  /**
   * Render the leaderboard screen.
   */
  function renderLeaderboard(container) {
    const div = document.createElement('div');
    div.className = 'container leaderboard';
    const title = document.createElement('h2');
    title.textContent = 'Leaderboard';
    div.appendChild(title);
    if (state.leaderboard.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No recorded exams or daily challenges yet.';
      div.appendChild(p);
    } else {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const trHead = document.createElement('tr');
      ['Date', 'Name', 'Type', 'Score', 'Percent'].forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      state.leaderboard.forEach(entry => {
        const tr = document.createElement('tr');
        const cells = [entry.date, entry.name, entry.type.charAt(0).toUpperCase() + entry.type.slice(1), `${entry.score}/${entry.total}`, `${entry.percent}%`];
        cells.forEach(text => {
          const td = document.createElement('td');
          td.textContent = text;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      div.appendChild(table);
    }
    const backBtn = createButton('Back', () => {
      state.view = 'home';
      render();
    });
    backBtn.classList.add('back-button');
    div.appendChild(backBtn);
    container.appendChild(div);
  }

  /**
   * Render the settings screen for customizing user and quiz parameters.
   */
  function renderSettings(container) {
    const div = document.createElement('div');
    div.className = 'container';
    const title = document.createElement('h2');
    title.textContent = 'Settings';
    div.appendChild(title);
    // Name
    const nameGroup = document.createElement('div');
    nameGroup.className = 'input-group';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = state.user.name;
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    div.appendChild(nameGroup);
    // Role
    const roleGroup = document.createElement('div');
    roleGroup.className = 'input-group';
    const roleLabel = document.createElement('label');
    roleLabel.textContent = 'Role';
    const roleInput = document.createElement('select');
    ['Student', 'Doctor', 'Nurse', 'Other'].forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      if (state.user.role === r) opt.selected = true;
      roleInput.appendChild(opt);
    });
    roleGroup.appendChild(roleLabel);
    roleGroup.appendChild(roleInput);
    div.appendChild(roleGroup);
    // Exam size
    const examGroup = document.createElement('div');
    examGroup.className = 'input-group';
    const examLabel = document.createElement('label');
    examLabel.textContent = 'Exam size (number of questions)';
    const examInput = document.createElement('input');
    examInput.type = 'number';
    examInput.min = 5;
    examInput.max = 50;
    examInput.value = state.settings.examSize;
    examGroup.appendChild(examLabel);
    examGroup.appendChild(examInput);
    div.appendChild(examGroup);
    // Time per question
    const timeGroup = document.createElement('div');
    timeGroup.className = 'input-group';
    const timeLabel = document.createElement('label');
    timeLabel.textContent = 'Time per question (seconds)';
    const timeInput = document.createElement('input');
    timeInput.type = 'number';
    timeInput.min = 5;
    timeInput.max = 300;
    timeInput.value = state.settings.timePerQ;
    timeGroup.appendChild(timeLabel);
    timeGroup.appendChild(timeInput);
    div.appendChild(timeGroup);
    // Save button
    const saveBtn = createButton('Save Settings', () => {
      // Update user and settings
      state.user.name = nameInput.value.trim() || 'Player';
      state.user.role = roleInput.value;
      state.settings.examSize = Math.max(5, Math.min(50, parseInt(examInput.value, 10) || 20));
      state.settings.timePerQ = Math.max(5, Math.min(300, parseInt(timeInput.value, 10) || 30));
      saveUser();
      saveSettings();
      // Confirmation alert
      alert('Settings saved!');
    });
    div.appendChild(saveBtn);
    // Back button
    const backBtn = createButton('Back', () => {
      state.view = 'home';
      render();
    });
    backBtn.classList.add('back-button');
    div.appendChild(backBtn);
    container.appendChild(div);
  }

  /**
   * Render the profile screen showing basic statistics.
   */
  function renderProfile(container) {
    const div = document.createElement('div');
    div.className = 'container';
    const title = document.createElement('h2');
    title.textContent = 'Profile';
    div.appendChild(title);
    const nameP = document.createElement('p');
    nameP.textContent = `Name: ${state.user.name}`;
    div.appendChild(nameP);
    const roleP = document.createElement('p');
    roleP.textContent = `Role: ${state.user.role}`;
    div.appendChild(roleP);
    // Compute simple stats from leaderboard
    const attempts = state.leaderboard.filter(e => e.name === state.user.name);
    const totalAttempts = attempts.length;
    let best = null;
    if (attempts.length > 0) {
      best = attempts.reduce((acc, cur) => cur.percent > acc.percent ? cur : acc, attempts[0]);
    }
    const attemptsP = document.createElement('p');
    attemptsP.textContent = `Recorded quizzes: ${totalAttempts}`;
    div.appendChild(attemptsP);
    const bestP = document.createElement('p');
    bestP.textContent = best ? `Best score: ${best.percent}% (${best.score}/${best.total} on ${best.date})` : 'No recorded scores yet.';
    div.appendChild(bestP);
    const backBtn = createButton('Back', () => {
      state.view = 'home';
      render();
    });
    backBtn.classList.add('back-button');
    div.appendChild(backBtn);
    container.appendChild(div);
  }

  /**
   * Start a timer for timed modes. Counts down each second and triggers automatic answer if time expires.
   */
  function startTimer() {
    const timerDiv = document.getElementById('timer');
    state.timeLeft = state.settings.timePerQ;
    timerDiv.textContent = `Time left: ${state.timeLeft}s`;
    // Clear any existing timer
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      state.timeLeft--;
      timerDiv.textContent = `Time left: ${state.timeLeft}s`;
      if (state.timeLeft <= 0) {
        // Time up: treat as incorrect answer
        clearInterval(state.timer);
        state.answers[state.currentIndex] = null; // mark unanswered
        // Simulate clicking none (no score increment)
        const optionsDiv = document.querySelector('.options');
        const explanationP = document.getElementById('explanation');
        handleAnswer(-1, null, optionsDiv, explanationP);
      }
    }, 1000);
  }

  /**
   * Utility: Shuffle an array in place using Fisher–Yates algorithm.
   */
  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Utility: Seeded shuffle to provide deterministic ordering for the daily challenge.
   */
  function seededShuffle(arr, seedString) {
    const seedFn = xmur3(seedString);
    const rand = mulberry32(seedFn());
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Seeded random number generator initialization (xmur3). Returns a function
   * that generates a 32‑bit hash from the provided string. Based on work by
   * https://stackoverflow.com/a/47593316
   */
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }

  /**
   * Pseudo‑random generator (mulberry32). Returns a deterministic function
   * that produces a pseudo‑random float [0,1) each call.
   */
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Initialize the application when the DOM is ready
  document.addEventListener('DOMContentLoaded', init);
})();