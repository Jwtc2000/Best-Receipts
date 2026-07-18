import {
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBKeyRange,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
  IDBVersionChangeEvent,
} from 'fake-indexeddb'
import { vi } from 'vitest'

/**
 * Point the next dynamic `import('../db')` at a brand-new, empty
 * IndexedDB. db.ts caches its connection at module scope, so tests must
 * reset modules *and* swap in a fresh set of fake IDB globals to get real
 * isolation between cases instead of accumulating state in one shared fake
 * database. The `idb` wrapper library does `instanceof` checks against the
 * global IDBRequest/IDBCursor/etc. constructors, so all of them (not just
 * `indexedDB` itself) need to come from the same fake-indexeddb instance.
 */
export function resetFakeIndexedDB() {
  vi.resetModules()
  Object.assign(globalThis, {
    indexedDB: new IDBFactory(),
    IDBCursor,
    IDBCursorWithValue,
    IDBDatabase,
    IDBFactory,
    IDBIndex,
    IDBKeyRange,
    IDBObjectStore,
    IDBOpenDBRequest,
    IDBRequest,
    IDBTransaction,
    IDBVersionChangeEvent,
  })
}
