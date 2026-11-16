/**
 * db.js — IndexedDB wrapper for Study Dash
 * Vanilla JS, no external library. idb-like async/await patterns.
 */

const DB_NAME    = 'StudyDashDB';
const DB_VERSION = 1;

/** @type {IDBDatabase|null} */
let _db = null;

/* ─── Schema definition ─────────────────────────────────── */
const SCHEMA = {
  subjects: {
    options:  { keyPath: 'id', autoIncrement: true },
    indexes:  [{ name: 'name', keyPath: 'name', unique: false }]
  },
  lessons: {
    options:  { keyPath: 'id', autoIncrement: true },
    indexes:  [
      { name: 'subjectId', keyPath: 'subjectId', unique: false },
      { name: 'title',     keyPath: 'title',     unique: false }
    ]
  },
  questions: {
    options:  { keyPath: 'id', autoIncrement: true },
    indexes:  [
      { name: 'subjectId',  keyPath: 'subjectId',  unique: false },
      { name: 'lessonId',   keyPath: 'lessonId',   unique: false },
      { name: 'difficulty', keyPath: 'difficulty', unique: false },
      { name: 'type',       keyPath: 'type',       unique: false }
    ]
  },
  gameScores: {
    options:  { keyPath: 'id', autoIncrement: true },
    indexes:  [
      { name: 'date',  keyPath: 'date',  unique: false },
      { name: 'score', keyPath: 'score', unique: false }
    ]
  },
  playerProgress: {
    options:  { keyPath: 'key' },
    indexes:  []
  },
  achievements: {
    options:  { keyPath: 'id' },
    indexes:  []
  },
  mistakeLog: {
    options:  { keyPath: 'id', autoIncrement: true },
    indexes:  [
      { name: 'questionId', keyPath: 'questionId', unique: false }
    ]
  },
  settings: {
    options:  { keyPath: 'key' },
    indexes:  []
  }
};

/* ─── Helper: promisify IDBRequest ──────────────────────── */
function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

/* ─── Helper: get a transaction + store ─────────────────── */
function getStore(storeName, mode = 'readonly') {
  if (!_db) throw new Error('DB not initialised — call DB.init() first');
  const tx    = _db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  return { tx, store };
}

/* ─── DB public API ─────────────────────────────────────── */
export const DB = {

  /**
   * Open (or upgrade) the database.
   * @returns {Promise<IDBDatabase>}
   */
  init() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db      = event.target.result;
        const oldVer  = event.oldVersion;

        // Create all object stores that don't exist yet
        for (const [storeName, def] of Object.entries(SCHEMA)) {
          let store;
          if (!db.objectStoreNames.contains(storeName)) {
            store = db.createObjectStore(storeName, def.options);
          } else {
            // On version bump, grab existing store from transaction
            store = event.target.transaction.objectStore(storeName);
          }

          // Create indexes
          for (const idx of def.indexes) {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
            }
          }
        }

        console.log(`[DB] Upgraded from v${oldVer} to v${DB_VERSION}`);
      };

      request.onsuccess = event => {
        _db = event.target.result;

        // Global error handler
        _db.onerror = e => console.error('[DB] Error:', e.target.error);

        console.log('[DB] Opened:', DB_NAME, 'v' + DB_VERSION);
        resolve(_db);
      };

      request.onerror = event => {
        console.error('[DB] Failed to open:', event.target.error);
        reject(event.target.error);
      };

      request.onblocked = () => {
        console.warn('[DB] Open blocked — please close other tabs');
      };
    });
  },

  /**
   * Add a record to a store.
   * @param {string} storeName
   * @param {object} data
   * @returns {Promise<IDBValidKey>} new key
   */
  add(storeName, data) {
    const { store } = getStore(storeName, 'readwrite');
    // Strip undefined id so autoIncrement works
    const record = { ...data };
    if (record.id === undefined || record.id === null || record.id === '') {
      delete record.id;
    }
    return idbRequest(store.add(record));
  },

  /**
   * Get a record by its primary key.
   * @param {string} storeName
   * @param {IDBValidKey} id
   * @returns {Promise<object|undefined>}
   */
  get(storeName, id) {
    const { store } = getStore(storeName, 'readonly');
    return idbRequest(store.get(id));
  },

  /**
   * Alias for get().
   */
  getById(storeName, id) {
    return this.get(storeName, id);
  },

  /**
   * Get all records from a store.
   * @param {string} storeName
   * @returns {Promise<object[]>}
   */
  getAll(storeName) {
    const { store } = getStore(storeName, 'readonly');
    return idbRequest(store.getAll());
  },

  /**
   * Get all records matching an index value.
   * @param {string} storeName
   * @param {string} indexName
   * @param {IDBValidKey} value
   * @returns {Promise<object[]>}
   */
  getAllByIndex(storeName, indexName, value) {
    const { store } = getStore(storeName, 'readonly');
    const index     = store.index(indexName);
    const range     = IDBKeyRange.only(value);
    return idbRequest(index.getAll(range));
  },

  /**
   * Put (upsert) a record — updates if key exists, adds if not.
   * @param {string} storeName
   * @param {object} data  — must include the keyPath field
   * @returns {Promise<IDBValidKey>}
   */
  put(storeName, data) {
    const { store } = getStore(storeName, 'readwrite');
    return idbRequest(store.put(data));
  },

  /**
   * Delete a record by its primary key.
   * @param {string} storeName
   * @param {IDBValidKey} id
   * @returns {Promise<undefined>}
   */
  delete(storeName, id) {
    const { store } = getStore(storeName, 'readwrite');
    return idbRequest(store.delete(id));
  },

  /**
   * Clear all records from a store.
   * @param {string} storeName
   * @returns {Promise<undefined>}
   */
  clear(storeName) {
    const { store } = getStore(storeName, 'readwrite');
    return idbRequest(store.clear());
  },

  /**
   * Count all records in a store (or range).
   * @param {string} storeName
   * @param {IDBKeyRange} [range] optional range
   * @returns {Promise<number>}
   */
  count(storeName, range) {
    const { store } = getStore(storeName, 'readonly');
    return idbRequest(range ? store.count(range) : store.count());
  },

  /**
   * In-memory filter search across all records.
   * @param {string} storeName
   * @param {string} field  — the property name to search
   * @param {string} query  — case-insensitive substring
   * @returns {Promise<object[]>}
   */
  async search(storeName, field, query) {
    const all = await this.getAll(storeName);
    if (!query || !query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter(item => {
      const val = item[field];
      return typeof val === 'string' && val.toLowerCase().includes(q);
    });
  },

  /**
   * Update specific fields of an existing record (patch).
   * @param {string} storeName
   * @param {IDBValidKey} id
   * @param {object} patch  — fields to merge
   * @returns {Promise<IDBValidKey>}
   */
  async patch(storeName, id, patch) {
    const existing = await this.get(storeName, id);
    if (!existing) throw new Error(`[DB] patch: record ${id} not found in ${storeName}`);
    return this.put(storeName, { ...existing, ...patch });
  },

  /**
   * Get all records sorted by a numeric/string field.
   * @param {string} storeName
   * @param {string} field
   * @param {'asc'|'desc'} [dir='asc']
   * @returns {Promise<object[]>}
   */
  async getAllSorted(storeName, field, dir = 'asc') {
    const all = await this.getAll(storeName);
    return all.sort((a, b) => {
      const av = a[field], bv = b[field];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'desc' ? -cmp : cmp;
    });
  },

  /**
   * Bulk add multiple records.
   * @param {string} storeName
   * @param {object[]} items
   * @returns {Promise<IDBValidKey[]>} array of new keys
   */
  bulkAdd(storeName, items) {
    return Promise.all(items.map(item => this.add(storeName, item)));
  },

  /**
   * Close the database connection.
   */
  close() {
    if (_db) {
      _db.close();
      _db = null;
      console.log('[DB] Closed');
    }
  },

  /**
   * Delete the entire database (dangerous — used for full reset).
   * @returns {Promise<void>}
   */
  destroy() {
    this.close();
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => { console.log('[DB] Deleted'); resolve(); };
      req.onerror   = () => reject(req.error);
      req.onblocked = () => console.warn('[DB] Delete blocked');
    });
  }
};

export default DB;
