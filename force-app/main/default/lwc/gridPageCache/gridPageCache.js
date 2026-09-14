/**
 * @description In-memory LRU (Least Recently Used) cache for grid pagination.
 * Bounded to a max size (default 10 pages) with a 5-minute TTL to prevent memory leaks and stale data.
 */
export class GridPageCache {
  constructor(maxPages = 10, ttlMs = 300000) {
    this.maxPages = maxPages;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get size() {
    return this.cache.size;
  }

  has(pageNumber) {
    if (!this.cache.has(pageNumber)) {
      return false;
    }
    const entry = this.cache.get(pageNumber);
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(pageNumber);
      return false;
    }
    return true;
  }

  get(pageNumber) {
    if (!this.has(pageNumber)) {
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    const entry = this.cache.get(pageNumber);
    this.cache.delete(pageNumber);
    this.cache.set(pageNumber, entry);

    return entry.data;
  }

  set(pageNumber, data) {
    if (this.cache.has(pageNumber)) {
      this.cache.delete(pageNumber);
    } else if (this.cache.size >= this.maxPages) {
      // Evict least recently used (first item in Map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(pageNumber, {
      data,
      timestamp: Date.now()
    });
  }

  delete(pageNumber) {
    return this.cache.delete(pageNumber);
  }

  clear() {
    this.cache.clear();
  }
}
