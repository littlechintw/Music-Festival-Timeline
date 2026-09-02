// @ts-check
// jsdom 沒有 IntersectionObserver / matchMedia 等 API；
// vitest 個別測試需要時可在這裡 stub。

// Node 22+ 自帶一個實驗性的 globalThis.localStorage getter，沒帶 --localstorage-file 時會回 undefined，
// 而 vitest 的 jsdom 環境不會覆蓋「已經存在」的 global，導致測試裡的 localStorage 是 undefined。
// 這裡補一個記憶體版 Storage，行為與瀏覽器一致（測試只需要 get/set/remove/clear）。
if (typeof globalThis.localStorage?.clear !== 'function') {
  /** @type {Map<string, string>} */
  const store = new Map();
  const memoryStorage = {
    get length() {
      return store.size;
    },
    /** @param {string} key */
    getItem(key) {
      return store.has(String(key)) ? /** @type {string} */ (store.get(String(key))) : null;
    },
    /** @param {string} key @param {string} value */
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    /** @param {string} key */
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    /** @param {number} index */
    key(index) {
      return [...store.keys()][index] ?? null;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
}
