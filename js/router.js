/**
 * router.js — Screen router for Study Dash.
 * Manages screen transitions, back-stack, bottom-nav sync, and URL hash.
 */

import { State } from './state.js';

/* ─── All known screens ─────────────────────────────────── */
export const SCREENS = [
  'home',
  'play',
  'lessons',
  'questionBank',
  'reviewer',
  'progress',
  'settings',
  'game',
  'studyMode',
  'examChallenge',
  'timeAttack',
  'customRun',
  'mistakeReview',
  'addLesson',
  'editLesson',
  'addQuestion',
  'editQuestion',
  'subjectManager'
];

/** Screens that map to bottom-nav tabs */
const TAB_SCREENS = new Set(['home', 'play', 'lessons', 'questionBank', 'progress']);

/** Screens that use the bottom nav (non-game, non-utility) */
const NAV_VISIBLE_SCREENS = new Set([
  'home', 'play', 'lessons', 'questionBank', 'progress',
  'settings', 'addLesson', 'editLesson', 'addQuestion',
  'editQuestion', 'subjectManager', 'reviewer', 'customRun', 'mistakeReview'
]);

/* ─── Router class ──────────────────────────────────────── */
class AppRouter {
  constructor() {
    /** @type {Array<{screen: string, params: object}>} */
    this._history = [];

    /** @type {string} */
    this._current = 'home';

    /** @type {object} */
    this._params  = {};

    /** @type {Map<string, Function[]>} beforeLeave guards */
    this._guards  = new Map();

    /** @type {Map<string, Function[]>} afterEnter hooks */
    this._hooks   = new Map();
  }

  /* ── Init ─────────────────────────────────────────────── */

  /**
   * Bootstrap the router: bind back buttons, bottom-nav, hash routing.
   */
  init() {
    this._bindBackButtons();
    this._bindBottomNav();
    this._bindHashChange();

    // Check if URL hash requests a specific screen on load
    const hash = window.location.hash.replace('#', '');
    if (hash && SCREENS.includes(hash)) {
      this.navigate(hash);
    } else {
      this._applyScreen('home', {}, false);
    }

    console.log('[Router] Initialised');
  }

  /* ── Navigate ─────────────────────────────────────────── */

  /**
   * Navigate to a screen, optionally passing parameters.
   * @param {string} screenName
   * @param {object} [params={}]
   * @param {boolean} [addToHistory=true]
   */
  async navigate(screenName, params = {}, addToHistory = true) {
    if (!SCREENS.includes(screenName)) {
      console.warn(`[Router] Unknown screen: "${screenName}"`);
      return;
    }

    // Run any beforeLeave guards on the current screen
    if (this._current !== screenName) {
      const guards = this._guards.get(this._current) || [];
      for (const guard of guards) {
        const allow = await guard(this._current, screenName, params);
        if (allow === false) {
          console.log(`[Router] Navigation blocked by guard on "${this._current}"`);
          return;
        }
      }
    }

    // Push current screen to history (unless going back or same screen)
    if (addToHistory && this._current !== screenName) {
      this._history.push({ screen: this._current, params: { ...this._params } });
      // Cap history at 50 entries
      if (this._history.length > 50) this._history.shift();
    }

    this._applyScreen(screenName, params);

    // Update hash without triggering hashchange
    const newHash = `#${screenName}`;
    if (window.location.hash !== newHash) {
      history.pushState({ screen: screenName, params }, '', newHash);
    }
  }

  /**
   * Go back one step in history.
   * Falls back to 'home' if history is empty.
   */
  back() {
    if (this._history.length > 0) {
      const entry = this._history.pop();
      this._applyScreen(entry.screen, entry.params, false);
      history.back();
    } else {
      this.navigate('home', {}, false);
    }
  }

  /**
   * Replace the current screen (no history entry).
   * @param {string} screenName
   * @param {object} [params={}]
   */
  replace(screenName, params = {}) {
    this.navigate(screenName, params, false);
  }

  /* ── Internal apply ───────────────────────────────────── */

  /**
   * Activate a screen in the DOM.
   * @param {string} screenName
   * @param {object} params
   * @param {boolean} [runHooks=true]
   */
  _applyScreen(screenName, params = {}, runHooks = true) {
    const prev = this._current;

    this._current = screenName;
    this._params  = params;

    // Hide all screens, show target
    for (const name of SCREENS) {
      const el = document.getElementById(`screen-${name}`);
      if (!el) continue;

      if (name === screenName) {
        el.classList.add('active');
        el.removeAttribute('aria-hidden');
        el.setAttribute('tabindex', '0');
      } else {
        el.classList.remove('active');
        el.setAttribute('aria-hidden', 'true');
        el.removeAttribute('tabindex');
      }
    }

    // Show/hide bottom nav
    const nav = document.getElementById('bottom-nav');
    if (nav) {
      if (screenName === 'game') {
        nav.style.display = 'none';
      } else {
        nav.style.display = '';
      }
    }

    // Show/hide game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      if (screenName === 'game') {
        gameContainer.classList.add('active');
      } else {
        gameContainer.classList.remove('active');
      }
    }

    // Update bottom-nav active tab
    this._syncBottomNav(screenName);

    // Update state
    State.setState({ currentScreen: screenName, screenParams: params }, true);

    // Run afterEnter hooks
    if (runHooks) {
      const hooks = this._hooks.get(screenName) || [];
      for (const hook of hooks) {
        try { hook(screenName, params, prev); } catch (e) { console.error('[Router] Hook error:', e); }
      }
      // Global hook
      const globalHooks = this._hooks.get('*') || [];
      for (const hook of globalHooks) {
        try { hook(screenName, params, prev); } catch (e) { console.error('[Router] Global hook error:', e); }
      }
    }

    // Focus management for accessibility
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      // Let screen render first
      requestAnimationFrame(() => {
        const focusable = target.querySelector('h2, h1, [autofocus]');
        if (focusable) focusable.focus({ preventScroll: false });
      });
    }

    console.log(`[Router] → ${screenName}`, params);
  }

  /* ── Bottom Nav Sync ──────────────────────────────────── */

  _syncBottomNav(screenName) {
    const tabs = document.querySelectorAll('#bottom-nav .nav-tab');
    for (const tab of tabs) {
      const tabScreen = tab.dataset.screen;
      const isActive  = tabScreen === screenName || (
        // Treat sub-screens as belonging to parent tab
        (tabScreen === 'lessons'      && ['addLesson', 'editLesson', 'subjectManager'].includes(screenName)) ||
        (tabScreen === 'questionBank' && ['addQuestion', 'editQuestion', 'reviewer'].includes(screenName)) ||
        (tabScreen === 'progress'     && [].includes(screenName))
      );

      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    }
  }

  /* ── Event Binding ────────────────────────────────────── */

  _bindBackButtons() {
    // Delegate: any .back-btn in the DOM
    document.addEventListener('click', e => {
      const btn = e.target.closest('.back-btn');
      if (btn) {
        e.preventDefault();
        this.back();
      }
    });

    // Browser/OS back button
    window.addEventListener('popstate', e => {
      if (e.state && e.state.screen) {
        this._applyScreen(e.state.screen, e.state.params || {}, false);
      } else {
        this.back();
      }
    });
  }

  _bindBottomNav() {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.addEventListener('click', e => {
      const tab = e.target.closest('.nav-tab');
      if (!tab) return;
      const screenName = tab.dataset.screen;
      if (screenName) {
        this.navigate(screenName);
      }
    });
  }

  _bindHashChange() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && SCREENS.includes(hash) && hash !== this._current) {
        this._applyScreen(hash, {});
      }
    });
  }

  /* ── Guards & Hooks ───────────────────────────────────── */

  /**
   * Register a beforeLeave guard on a screen.
   * Guard fn: (from, to, params) => boolean | Promise<boolean>
   * Return false to block navigation.
   * @param {string} screenName
   * @param {Function} fn
   */
  beforeLeave(screenName, fn) {
    if (!this._guards.has(screenName)) this._guards.set(screenName, []);
    this._guards.get(screenName).push(fn);
  }

  /**
   * Register an afterEnter hook on a screen (or '*' for all).
   * Hook fn: (screen, params, prevScreen) => void
   * @param {string} screenName  — screen name or '*'
   * @param {Function} fn
   */
  afterEnter(screenName, fn) {
    if (!this._hooks.has(screenName)) this._hooks.set(screenName, []);
    this._hooks.get(screenName).push(fn);
  }

  /* ── Getters ──────────────────────────────────────────── */

  /** @returns {string} current screen name */
  get current() { return this._current; }

  /** @returns {object} current screen params */
  get params() { return { ...this._params }; }

  /** @returns {boolean} can go back */
  get canGoBack() { return this._history.length > 0; }

  /** @returns {string|null} previous screen name */
  get previous() {
    return this._history.length > 0
      ? this._history[this._history.length - 1].screen
      : null;
  }
}

/* ─── Singleton export ──────────────────────────────────── */
const _routerInstance = new AppRouter();
export { _routerInstance as Router };
export default _routerInstance;
