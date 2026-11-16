/**
 * state.js — Central application state manager for Study Dash.
 * EventEmitter pattern + auto-persist to IndexedDB on change.
 */

import { DB } from './db.js';

/* ─── Default state shape ───────────────────────────────── */
const DEFAULT_STATE = {
  /** Which screen is currently visible */
  currentScreen: 'home',

  /** Navigation params passed to the current screen */
  screenParams: {},

  /** Current user profile */
  currentUser: {
    name: 'Player'
  },

  /** All subjects from DB */
  subjects: [],

  /** All lessons from DB */
  lessons: [],

  /** All questions from DB */
  questions: [],

  /** Player progress record */
  playerProgress: {
    key:           'main',
    coins:         0,
    totalAnswered: 0,
    correct:       0,
    streak:        0,
    bestStreak:    0,
    dailyGoal:     20,
    dailyAnswered: 0,
    lastPlayDate:  null,
    level:         1,
    xp:            0
  },

  /** App settings */
  settings: {
    key:              'main',
    username:         '',
    sfx:              true,
    music:            true,
    vibration:        true,
    dailyGoal:        20,
    showExplanations: true,
    theme:            'dark'
  },

  /** Active session data (for game/study/exam modes) */
  activeSession: null,

  /** UI state flags */
  ui: {
    loading:        true,
    modalOpen:      false,
    gameActive:     false
  }
};

/* ─── EventEmitter ──────────────────────────────────────── */
class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} listener
   * @returns {Function} unsubscribe function
   */
  on(event, listener) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(listener);
    // Return an unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Subscribe for a single emission only.
   * @param {string} event
   * @param {Function} listener
   */
  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} listener
   */
  off(event, listener) {
    this._listeners.get(event)?.delete(listener);
  }

  /**
   * Emit an event, calling all listeners with the given arguments.
   * @param {string} event
   * @param {...*} args
   */
  emit(event, ...args) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(...args);
      } catch (err) {
        console.error(`[State] Listener error on "${event}":`, err);
      }
    }
  }

  /** Remove all listeners for a specific event (or all events). */
  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

/* ─── StateManager ──────────────────────────────────────── */
class StateManager extends EventEmitter {
  constructor() {
    super();
    // Deep clone the default state
    this._state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this._persistQueued = false;
  }

  /* ── Accessors ──────────────────────────────────────────── */

  /**
   * Get the full state object (read-only snapshot).
   * @returns {object}
   */
  getState() {
    return this._state;
  }

  /**
   * Get a specific top-level slice.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this._state[key];
  }

  /* ── Mutations ──────────────────────────────────────────── */

  /**
   * Merge a partial update into the state and emit change events.
   * @param {object} partial  — shallow or nested object to merge
   * @param {boolean} [silent=false]  — skip emit when true
   */
  setState(partial, silent = false) {
    const prev = { ...this._state };

    for (const [key, value] of Object.entries(partial)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof this._state[key] === 'object' &&
        this._state[key] !== null &&
        !Array.isArray(this._state[key])
      ) {
        // Deep merge for plain objects
        this._state[key] = { ...this._state[key], ...value };
      } else {
        // Replace arrays and primitives
        this._state[key] = value;
      }
    }

    if (!silent) {
      // Emit specific change events for each changed key
      for (const key of Object.keys(partial)) {
        this.emit(`change:${key}`, this._state[key], prev[key]);
      }
      // Emit a catch-all change event
      this.emit('change', this._state, prev, Object.keys(partial));
    }

    // Schedule persistence for settings / progress changes
    const persistKeys = ['settings', 'playerProgress', 'currentUser'];
    if (persistKeys.some(k => k in partial)) {
      this._schedulePersist(partial);
    }
  }

  /**
   * Subscribe to any state change.
   * @param {Function} listener — called with (newState, prevState, changedKeys)
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    return this.on('change', listener);
  }

  /**
   * Subscribe to a specific key change.
   * @param {string} key
   * @param {Function} listener — called with (newValue, prevValue)
   * @returns {Function} unsubscribe
   */
  watch(key, listener) {
    return this.on(`change:${key}`, listener);
  }

  /* ── Helpers ────────────────────────────────────────────── */

  /** Convenience: set current screen */
  navigate(screenName, params = {}) {
    this.setState({ currentScreen: screenName, screenParams: params });
  }

  /** Convenience: update player progress fields */
  updateProgress(patch) {
    const updated = { ...this._state.playerProgress, ...patch };
    this.setState({ playerProgress: updated });
  }

  /** Convenience: update settings fields */
  updateSettings(patch) {
    const updated = { ...this._state.settings, ...patch };
    this.setState({ settings: updated });
  }

  /** Add coins to player balance */
  addCoins(amount) {
    const coins = (this._state.playerProgress.coins || 0) + amount;
    this.updateProgress({ coins });
  }

  /** Record an answered question */
  recordAnswer(isCorrect) {
    const p = this._state.playerProgress;
    const totalAnswered  = p.totalAnswered + 1;
    const correct        = p.correct + (isCorrect ? 1 : 0);
    const streak         = isCorrect ? p.streak + 1 : 0;
    const bestStreak     = Math.max(streak, p.bestStreak || 0);
    const dailyAnswered  = p.dailyAnswered + 1;
    this.updateProgress({ totalAnswered, correct, streak, bestStreak, dailyAnswered });
  }

  /* ── Persistence ────────────────────────────────────────── */

  /**
   * Throttled DB write — batches rapid state changes into a single write.
   * @param {object} partial
   */
  _schedulePersist(partial) {
    if (this._persistQueued) return;
    this._persistQueued = true;
    // Microtask: run after current synchronous batch
    queueMicrotask(() => {
      this._persistQueued = false;
      this._persist(partial).catch(err =>
        console.error('[State] Persist error:', err)
      );
    });
  }

  async _persist(partial) {
    if ('settings' in partial) {
      await DB.put('settings', this._state.settings);
    }
    if ('playerProgress' in partial) {
      await DB.put('playerProgress', this._state.playerProgress);
    }
  }

  /* ── Loading from DB ────────────────────────────────────── */

  /**
   * Load all persistent state from IndexedDB into memory.
   * Call after DB.init().
   */
  async loadFromDB() {
    try {
      // Load settings
      const settings = await DB.get('settings', 'main');
      if (settings) {
        this._state.settings = { ...this._state.settings, ...settings };
      }

      // Load player progress
      const progress = await DB.get('playerProgress', 'main');
      if (progress) {
        // Reset daily count if last play date was not today
        const today = new Date().toDateString();
        if (progress.lastPlayDate !== today) {
          progress.dailyAnswered = 0;
          progress.lastPlayDate  = today;
        }
        this._state.playerProgress = { ...this._state.playerProgress, ...progress };
      }

      // Load all collections
      const [subjects, lessons, questions] = await Promise.all([
        DB.getAll('subjects'),
        DB.getAll('lessons'),
        DB.getAll('questions')
      ]);

      this._state.subjects  = subjects;
      this._state.lessons   = lessons;
      this._state.questions = questions;

      // Apply username from settings
      if (this._state.settings.username) {
        this._state.currentUser = { name: this._state.settings.username };
      }

      console.log('[State] Loaded from DB:', {
        subjects:  subjects.length,
        lessons:   lessons.length,
        questions: questions.length
      });
    } catch (err) {
      console.error('[State] Failed to load from DB:', err);
    }
  }

  /**
   * Reload a specific collection from DB into state.
   * @param {'subjects'|'lessons'|'questions'} collection
   */
  async reloadCollection(collection) {
    const data = await DB.getAll(collection);
    this.setState({ [collection]: data });
    return data;
  }

  /* ── Reset ──────────────────────────────────────────────── */

  /**
   * Reset all state to defaults (does NOT clear DB — use DB.destroy() for that).
   */
  reset() {
    this._state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.emit('reset', this._state);
    this.emit('change', this._state, {}, Object.keys(DEFAULT_STATE));
  }
}

/* ─── Singleton export ──────────────────────────────────── */
export const State = new StateManager();
export default State;
