/**
 * STUDY DASH — Home Dashboard Screen
 * Exports: render(params), init(params), destroy()
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "It does not matter how slowly you go, as long as you do not stop.", author: "Confucius" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
];

const PALETTE = {
  primary: '#6C63FF',
  accent:  '#FF6584',
  success: '#2DD4BF',
  warning: '#F59E0B',
  bg:      '#0F0F1A',
  card:    '#1A1A2E',
  text:    '#E0E0FF',
};

// ─── Module-level state ───────────────────────────────────────────────────────

let _quoteIndex   = 0;
let _quoteTimer   = null;
let _pulseTimer   = null;
let _listeners    = [];   // { el, type, fn } tuples for cleanup

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readData() {
  try {
    const raw = localStorage.getItem('studydash_data');
    if (!raw) return { subjects: [], lessons: [], questions: [], sessions: [] };
    const d = JSON.parse(raw);
    return {
      subjects:  Array.isArray(d.subjects)  ? d.subjects  : [],
      lessons:   Array.isArray(d.lessons)   ? d.lessons   : [],
      questions: Array.isArray(d.questions) ? d.questions : [],
      sessions:  Array.isArray(d.sessions)  ? d.sessions  : [],
    };
  } catch {
    return { subjects: [], lessons: [], questions: [], sessions: [] };
  }
}

function readStreak() {
  const v = parseInt(localStorage.getItem('studydash_streak'), 10);
  return isNaN(v) ? 0 : v;
}

function calcAccuracy(questions) {
  if (!questions.length) return 0;
  const correct = questions.filter(q => q.correct === true || q.correct === 1).length;
  return Math.round((correct / questions.length) * 100);
}

function calcMistakesToReview(questions) {
  return questions.filter(q => q.correct === false || q.correct === 0).length;
}

function subjectProgress(subjects, lessons) {
  return subjects.map(sub => {
    const subLessons = lessons.filter(l => l.subjectId === sub.id || l.subject === sub.id);
    if (!subLessons.length) return { name: sub.name || sub.title || 'Subject', pct: 0 };
    const done = subLessons.filter(l => l.completed || l.done).length;
    return {
      name:  sub.name || sub.title || 'Subject',
      pct:   Math.round((done / subLessons.length) * 100),
      color: sub.color || PALETTE.primary,
    };
  });
}

function formatTime(isoOrTs) {
  if (!isoOrTs) return '';
  const d = new Date(isoOrTs);
  if (isNaN(d)) return '';
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function on(el, type, fn) {
  if (!el) return;
  el.addEventListener(type, fn);
  _listeners.push({ el, type, fn });
}

function navigate(screen) {
  document.dispatchEvent(new CustomEvent('navigate', { detail: { screen } }));
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function renderStyles() {
  return `
<style id="home-screen-styles">
  /* ── Reset & base ── */
  #home-screen *, #home-screen *::before, #home-screen *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  #home-screen {
    font-family: system-ui, -apple-system, sans-serif;
    background: ${PALETTE.bg};
    color: ${PALETTE.text};
    min-height: 100vh;
    padding-bottom: 2rem;
    overflow-x: hidden;
  }

  /* ── Keyframes ── */
  @keyframes sd-pulse {
    0%, 100% { transform: scale(1);   opacity: 1; }
    50%       { transform: scale(1.06); opacity: 0.85; }
  }
  @keyframes sd-fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes sd-flicker {
    0%, 100% { opacity: 1; }
    45%      { opacity: 0.8; }
    55%      { opacity: 1; }
  }
  @keyframes sd-barFill {
    from { width: 0%; }
  }
  @keyframes sd-quoteFade {
    0%   { opacity: 0; transform: translateY(6px); }
    15%  { opacity: 1; transform: translateY(0); }
    85%  { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-6px); }
  }
  @keyframes sd-spin {
    to { transform: rotate(360deg); }
  }

  /* ── Hero / banner ── */
  .sd-hero {
    background: linear-gradient(135deg, #6C63FF 0%, #FF6584 50%, #2DD4BF 100%);
    background-size: 300% 300%;
    animation: sd-gradientShift 8s ease infinite;
    padding: 2rem 1.25rem 2.5rem;
    position: relative;
    overflow: hidden;
  }
  .sd-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  .sd-hero-inner {
    position: relative;
    z-index: 1;
  }
  .sd-logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.6rem;
  }
  .sd-logo-icon {
    width: 2.6rem;
    height: 2.6rem;
    background: rgba(255,255,255,0.18);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    animation: sd-pulse 2.4s ease-in-out infinite;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  }
  .sd-logo-text {
    font-size: 1.5rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .sd-welcome {
    font-size: 0.95rem;
    color: rgba(255,255,255,0.88);
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  .sd-tagline {
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  /* ── Streak badge ── */
  .sd-streak {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 999px;
    padding: 0.3rem 0.8rem;
    margin-top: 1rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: #fff;
  }
  .sd-streak-flame {
    font-size: 1.1rem;
    animation: sd-flicker 2s ease-in-out infinite;
    display: inline-block;
  }

  /* ── Review pill ── */
  .sd-review-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: ${PALETTE.warning};
    color: #000;
    border-radius: 999px;
    padding: 0.28rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    margin-top: 0.6rem;
    margin-left: 0.5rem;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 2px 10px rgba(245,158,11,0.4);
  }
  .sd-review-pill:hover, .sd-review-pill:focus-visible {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(245,158,11,0.55);
    outline: none;
  }

  /* ── Content wrapper ── */
  .sd-content {
    padding: 0 1rem;
  }

  /* ── Section header ── */
  .sd-section-header {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(224,224,255,0.45);
    margin: 1.5rem 0 0.65rem;
  }

  /* ── Stats grid ── */
  .sd-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    animation: sd-fadeInUp 0.5s ease both;
    animation-delay: 0.1s;
  }
  @media (min-width: 480px) {
    .sd-stats-grid { grid-template-columns: repeat(4, 1fr); }
  }
  .sd-stat-card {
    background: ${PALETTE.card};
    border-radius: 1rem;
    padding: 1rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset;
    border: 1px solid rgba(255,255,255,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .sd-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.4);
  }
  .sd-stat-icon {
    font-size: 1.3rem;
    line-height: 1;
    margin-bottom: 0.1rem;
  }
  .sd-stat-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }
  .sd-stat-label {
    font-size: 0.72rem;
    color: rgba(224,224,255,0.5);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── CTA buttons ── */
  .sd-cta-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    animation: sd-fadeInUp 0.5s ease both;
    animation-delay: 0.2s;
  }
  .sd-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
    border-radius: 1rem;
    font-family: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    text-align: center;
    -webkit-tap-highlight-color: transparent;
    outline-offset: 3px;
  }
  .sd-btn:hover  { filter: brightness(1.08); }
  .sd-btn:active { transform: scale(0.97); }
  .sd-btn:focus-visible { outline: 2px solid #fff; }

  .sd-btn-play {
    background: linear-gradient(135deg, ${PALETTE.primary} 0%, #9B5DE5 100%);
    color: #fff;
    font-size: 1.1rem;
    padding: 1rem 1.5rem;
    box-shadow: 0 6px 24px rgba(108,99,255,0.5);
    animation: sd-pulse 3s ease-in-out infinite;
  }
  .sd-btn-play:hover {
    box-shadow: 0 10px 32px rgba(108,99,255,0.65);
  }

  .sd-btn-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }
  .sd-btn-secondary {
    background: ${PALETTE.card};
    color: ${PALETTE.text};
    font-size: 0.9rem;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  }
  .sd-btn-secondary:hover {
    background: #24243e;
    border-color: rgba(108,99,255,0.4);
  }

  /* ── Quote card ── */
  .sd-quote-card {
    background: linear-gradient(135deg, rgba(108,99,255,0.12), rgba(255,101,132,0.08));
    border: 1px solid rgba(108,99,255,0.2);
    border-radius: 1rem;
    padding: 1.1rem 1.1rem;
    position: relative;
    overflow: hidden;
    min-height: 90px;
    animation: sd-fadeInUp 0.5s ease both;
    animation-delay: 0.3s;
  }
  .sd-quote-card::before {
    content: '"';
    position: absolute;
    top: -0.5rem;
    left: 0.6rem;
    font-size: 5rem;
    line-height: 1;
    color: rgba(108,99,255,0.12);
    font-family: Georgia, serif;
    pointer-events: none;
  }
  .sd-quote-text {
    font-size: 0.92rem;
    font-style: italic;
    color: rgba(224,224,255,0.9);
    line-height: 1.55;
    position: relative;
    z-index: 1;
    animation: sd-quoteFade 10s ease-in-out infinite;
  }
  .sd-quote-author {
    font-size: 0.75rem;
    font-weight: 700;
    color: ${PALETTE.primary};
    margin-top: 0.4rem;
    position: relative;
    z-index: 1;
  }

  /* ── Progress bars ── */
  .sd-progress-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    animation: sd-fadeInUp 0.5s ease both;
    animation-delay: 0.35s;
  }
  .sd-progress-item {}
  .sd-progress-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.35rem;
  }
  .sd-progress-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${PALETTE.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
  }
  .sd-progress-pct {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(224,224,255,0.5);
  }
  .sd-progress-track {
    background: rgba(255,255,255,0.07);
    border-radius: 999px;
    height: 7px;
    overflow: hidden;
  }
  .sd-progress-bar {
    height: 100%;
    border-radius: 999px;
    animation: sd-barFill 0.9s cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: 0.4s;
  }
  .sd-progress-empty {
    color: rgba(224,224,255,0.35);
    font-size: 0.82rem;
    text-align: center;
    padding: 0.5rem 0;
  }

  /* ── Recent activity ── */
  .sd-activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    animation: sd-fadeInUp 0.5s ease both;
    animation-delay: 0.4s;
  }
  .sd-activity-item {
    background: ${PALETTE.card};
    border-radius: 0.8rem;
    padding: 0.75rem 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid rgba(255,255,255,0.04);
    transition: transform 0.15s;
  }
  .sd-activity-item:hover { transform: translateX(3px); }
  .sd-activity-icon {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }
  .sd-activity-body {
    flex: 1;
    min-width: 0;
  }
  .sd-activity-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${PALETTE.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sd-activity-sub {
    font-size: 0.72rem;
    color: rgba(224,224,255,0.4);
    margin-top: 0.1rem;
  }
  .sd-activity-time {
    font-size: 0.7rem;
    color: rgba(224,224,255,0.3);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .sd-activity-empty {
    color: rgba(224,224,255,0.3);
    font-size: 0.82rem;
    text-align: center;
    padding: 0.5rem 0;
  }

  /* ── Misc utility ── */
  .sd-pill-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.75rem;
  }
</style>`;
}

function renderStatsGrid(data) {
  const accuracy = calcAccuracy(data.questions);
  const stats = [
    { icon: '📚', value: data.subjects.length,  label: 'Subjects'  },
    { icon: '📖', value: data.lessons.length,   label: 'Lessons'   },
    { icon: '❓', value: data.questions.length, label: 'Questions' },
    { icon: '🎯', value: accuracy + '%',        label: 'Accuracy'  },
  ];
  return `
<p class="sd-section-header">Overview</p>
<div class="sd-stats-grid">
  ${stats.map(s => `
  <div class="sd-stat-card">
    <div class="sd-stat-icon">${s.icon}</div>
    <div class="sd-stat-value">${s.value}</div>
    <div class="sd-stat-label">${s.label}</div>
  </div>`).join('')}
</div>`;
}

function renderCTA() {
  return `
<p class="sd-section-header">Quick Actions</p>
<div class="sd-cta-wrap">
  <button class="sd-btn sd-btn-play" data-nav="play">
    <span>⚡</span> Play Now
  </button>
  <div class="sd-btn-row">
    <button class="sd-btn sd-btn-secondary" data-nav="study">
      📝 Study Mode
    </button>
    <button class="sd-btn sd-btn-secondary" data-nav="questions">
      🏆 Take Exam
    </button>
  </div>
</div>`;
}

function renderQuote(index) {
  const q = QUOTES[index % QUOTES.length];
  return `
<p class="sd-section-header">Daily Motivation</p>
<div class="sd-quote-card">
  <div class="sd-quote-text" id="sd-quote-text">${escHtml(q.text)}</div>
  <div class="sd-quote-author" id="sd-quote-author">— ${escHtml(q.author)}</div>
</div>`;
}

function renderProgress(subjects, lessons) {
  const items = subjectProgress(subjects, lessons);
  let inner = '';
  if (!items.length) {
    inner = `<p class="sd-progress-empty">No subjects yet. Add one to track progress!</p>`;
  } else {
    inner = items.map(item => `
    <div class="sd-progress-item">
      <div class="sd-progress-meta">
        <span class="sd-progress-name">${escHtml(item.name)}</span>
        <span class="sd-progress-pct">${item.pct}%</span>
      </div>
      <div class="sd-progress-track">
        <div class="sd-progress-bar"
             style="width:${item.pct}%;background:${escHtml(item.color || PALETTE.primary)};"
             role="progressbar"
             aria-valuenow="${item.pct}"
             aria-valuemin="0"
             aria-valuemax="100">
        </div>
      </div>
    </div>`).join('');
  }
  return `
<p class="sd-section-header">Subject Progress</p>
<div class="sd-progress-list">${inner}</div>`;
}

function renderActivity(sessions) {
  const recent = sessions.slice(-5).reverse();
  if (!recent.length) {
    return `
<p class="sd-section-header">Recent Activity</p>
<div class="sd-activity-list">
  <p class="sd-activity-empty">No sessions yet. Start playing to see your history!</p>
</div>`;
  }

  const typeMap = {
    play:  { icon: '⚡', bg: 'rgba(108,99,255,0.18)' },
    study: { icon: '📝', bg: 'rgba(45,212,191,0.15)' },
    exam:  { icon: '🏆', bg: 'rgba(255,101,132,0.15)' },
  };

  const items = recent.map(s => {
    const type   = s.type || 'play';
    const meta   = typeMap[type] || typeMap.play;
    const title  = s.subject || s.title || 'Session';
    const score  = s.score != null ? `Score: ${s.score}` : '';
    const timing = formatTime(s.endedAt || s.startedAt || s.date);
    return `
    <div class="sd-activity-item">
      <div class="sd-activity-icon" style="background:${meta.bg}">${meta.icon}</div>
      <div class="sd-activity-body">
        <div class="sd-activity-title">${escHtml(title)}</div>
        ${score ? `<div class="sd-activity-sub">${escHtml(score)}</div>` : ''}
      </div>
      <div class="sd-activity-time">${timing}</div>
    </div>`;
  }).join('');

  return `
<p class="sd-section-header">Recent Activity</p>
<div class="sd-activity-list">${items}</div>`;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full HTML string for the home screen.
 * @param {object} [params]
 */
export function render(params = {}) {
  const data     = readData();
  const streak   = readStreak();
  const mistakes = calcMistakesToReview(data.questions);

  _quoteIndex = Math.floor(Math.random() * QUOTES.length);

  const reviewPill = mistakes > 0
    ? `<button class="sd-review-pill" data-nav="questions" aria-label="Review ${mistakes} mistakes">
         ⚠️ ${mistakes} to Review
       </button>`
    : '';

  return `
${renderStyles()}
<div id="home-screen" role="main" aria-label="Home Dashboard">

  <!-- ── Hero ── -->
  <header class="sd-hero">
    <div class="sd-hero-inner">
      <div class="sd-logo">
        <div class="sd-logo-icon" aria-hidden="true">🚀</div>
        <span class="sd-logo-text">STUDY DASH</span>
      </div>
      <p class="sd-welcome">Welcome back! Ready to level up?</p>
      <p class="sd-tagline">Your learning adventure awaits.</p>

      <div class="sd-pill-row">
        <div class="sd-streak" aria-label="${streak} day streak">
          <span class="sd-streak-flame" aria-hidden="true">🔥</span>
          <span>${streak} day${streak !== 1 ? 's' : ''} streak</span>
        </div>
        ${reviewPill}
      </div>
    </div>
  </header>

  <!-- ── Content ── -->
  <div class="sd-content">
    ${renderStatsGrid(data)}
    ${renderCTA()}
    ${renderQuote(_quoteIndex)}
    ${renderProgress(data.subjects, data.lessons)}
    ${renderActivity(data.sessions)}
  </div>

</div>`;
}

/**
 * Called after the HTML is inserted into the DOM.
 * Wires up events, starts timers, etc.
 * @param {object} [params]
 */
export function init(params = {}) {
  // ── Navigation buttons ──────────────────────────────────────────────────────
  const root = document.getElementById('home-screen');
  if (!root) return;

  root.querySelectorAll('[data-nav]').forEach(btn => {
    on(btn, 'click', () => navigate(btn.dataset.nav));
    on(btn, 'keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(btn.dataset.nav);
      }
    });
  });

  // ── Rotating quote every 10 s ───────────────────────────────────────────────
  _quoteTimer = setInterval(() => {
    _quoteIndex = (_quoteIndex + 1) % QUOTES.length;
    const q       = QUOTES[_quoteIndex];
    const textEl  = document.getElementById('sd-quote-text');
    const authEl  = document.getElementById('sd-quote-author');
    if (!textEl || !authEl) return;

    // Fade out → swap → animation restarts
    textEl.style.animation = 'none';
    authEl.style.opacity   = '0';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textEl.textContent = q.text;
        authEl.textContent = `— ${q.author}`;
        textEl.style.animation = '';
        authEl.style.opacity   = '1';
        authEl.style.transition = 'opacity 0.5s';
      });
    });
  }, 10_000);

  // ── Stat card ripple (touch feedback) ──────────────────────────────────────
  root.querySelectorAll('.sd-stat-card').forEach(card => {
    on(card, 'pointerdown', () => {
      card.style.transform = 'scale(0.97)';
    });
    on(card, 'pointerup',   () => { card.style.transform = ''; });
    on(card, 'pointerleave',() => { card.style.transform = ''; });
  });

  // ── Progress bars: re-trigger animation on visibility ──────────────────────
  if ('IntersectionObserver' in window) {
    const bars = root.querySelectorAll('.sd-progress-bar');
    const obs  = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          bar.style.animationName = 'none';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              bar.style.animationName = '';
            });
          });
          obs.unobserve(bar);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach(b => obs.observe(b));
    // Store for cleanup
    _listeners.push({ _obs: obs, _bars: bars });
  }
}

/**
 * Cleans up timers and event listeners.
 */
export function destroy() {
  // Clear timers
  clearInterval(_quoteTimer);
  clearInterval(_pulseTimer);
  _quoteTimer = null;
  _pulseTimer = null;

  // Remove event listeners
  _listeners.forEach(item => {
    if (item.el && item.type && item.fn) {
      item.el.removeEventListener(item.type, item.fn);
    }
    // Disconnect IntersectionObserver if stored
    if (item._obs) {
      item._obs.disconnect();
    }
  });
  _listeners = [];

  // Remove injected styles
  const styleEl = document.getElementById('home-screen-styles');
  if (styleEl) styleEl.remove();
}
