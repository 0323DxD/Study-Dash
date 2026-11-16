/* ============================================================
   STUDY DASH — Service Worker  (sw.js)
   Cache-first strategy with network fallback
   ============================================================ */

const CACHE_NAME = 'study-dash-v1';
const DYNAMIC_CACHE = 'study-dash-dynamic-v1';

// Assets to pre-cache on install
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './js/main.js',
  './js/db.js',
  './js/state.js',
  './js/router.js',
  './js/game/GameManager.js',
  './js/game/BootScene.js',
  './js/game/GameScene.js',
  './js/game/GameOverScene.js',
  './js/game/TouchControls.js',
  './js/services/SeedData.js',
  './js/services/GameQuestionService.js',
  './js/services/ImportService.js',
  './js/services/ExportService.js',
  './js/services/SubjectService.js',
  './js/services/LessonService.js',
  './js/services/QuestionService.js',
  './js/services/ProgressService.js',
  './js/modes/StudyMode.js',
  './js/modes/ExamChallengeMode.js',
  './js/modes/TimeAttackMode.js',
  './js/modes/MistakeReviewMode.js',
  './js/modes/CustomReviewerRun.js',
  './js/screens/reviewerScreen.js',
  './js/modals/ImportModal.js',
  './js/modals/ExportModal.js'
];

// CDN assets to cache when fetched
const CDN_ORIGINS = [
  'https://cdn.jsdelivr.net',
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  console.log('[SW] Installing cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache each asset individually so one failure doesn't block all
      const promises = PRE_CACHE_ASSETS.map(url =>
        cache.add(url).catch(err =>
          console.warn('[SW] Failed to pre-cache:', url, err)
        )
      );
      return Promise.all(promises);
    }).then(() => {
      console.log('[SW] Pre-cache complete');
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', event => {
  console.log('[SW] Activating, cleaning old caches…');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      const deletePromises = cacheNames
        .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
        .map(name => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        });
      return Promise.all(deletePromises);
    }).then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip browser-sync, dev-server, chrome-extension, etc.
  if (
    url.protocol === 'chrome-extension:' ||
    url.hostname === 'localhost' && url.port === '35729'
  ) return;

  // For CDN assets: network-first with dynamic cache fallback
  if (CDN_ORIGINS.some(origin => request.url.startsWith(origin))) {
    event.respondWith(networkFirstThenDynamic(request));
    return;
  }

  // For app assets: cache-first with network fallback
  event.respondWith(cacheFirstThenNetwork(request));
});

/* ── STRATEGIES ── */

async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline — asset unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function networkFirstThenDynamic(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('CDN resource unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/* ── MESSAGE HANDLER (for cache busting from app) ── */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0] && event.ports[0].postMessage({ success: true });
    });
  }
});
