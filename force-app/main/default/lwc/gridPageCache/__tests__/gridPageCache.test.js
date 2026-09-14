import { GridPageCache } from "c/gridPageCache";

describe("GridPageCache", () => {
  test("stores and retrieves cached page data", () => {
    const cache = new GridPageCache(10);
    const pageData = { records: [{ Id: "001", Name: "Test" }], totalSize: 1 };

    cache.set(1, pageData);
    expect(cache.has(1)).toBe(true);
    expect(cache.get(1)).toEqual(pageData);
    expect(cache.size).toBe(1);
  });

  test("returns null for non-existent page", () => {
    const cache = new GridPageCache(10);
    expect(cache.has(99)).toBe(false);
    expect(cache.get(99)).toBeNull();
  });

  test("evicts least recently used page when maxPages is exceeded (TC-04-B1)", () => {
    const cache = new GridPageCache(3);

    cache.set(1, { page: 1 });
    cache.set(2, { page: 2 });
    cache.set(3, { page: 3 });
    expect(cache.size).toBe(3);

    // Adding 4th page evicts Page 1 (oldest)
    cache.set(4, { page: 4 });
    expect(cache.size).toBe(3);
    expect(cache.has(1)).toBe(false);
    expect(cache.has(2)).toBe(true);
    expect(cache.has(3)).toBe(true);
    expect(cache.has(4)).toBe(true);
  });

  test("refreshes LRU recency on get access", () => {
    const cache = new GridPageCache(3);

    cache.set(1, { page: 1 });
    cache.set(2, { page: 2 });
    cache.set(3, { page: 3 });

    // Access Page 1, making Page 2 the oldest
    cache.get(1);

    // Adding Page 4 should now evict Page 2, NOT Page 1
    cache.set(4, { page: 4 });

    expect(cache.has(1)).toBe(true);
    expect(cache.has(2)).toBe(false);
    expect(cache.has(3)).toBe(true);
    expect(cache.has(4)).toBe(true);
  });

  test("invalidates expired entries based on TTL", () => {
    const cache = new GridPageCache(10, 50); // 50ms TTL
    cache.set(1, { page: 1 });

    expect(cache.has(1)).toBe(true);

    // Mock Date.now moving forward by 100ms
    const originalNow = Date.now;
    try {
      Date.now = jest.fn(() => originalNow() + 100);
      expect(cache.has(1)).toBe(false);
      expect(cache.get(1)).toBeNull();
      expect(cache.size).toBe(0);
    } finally {
      Date.now = originalNow;
    }
  });

  test("clears all pages (TC-04-P3, TC-04-P4)", () => {
    const cache = new GridPageCache(10);
    cache.set(1, { page: 1 });
    cache.set(2, { page: 2 });
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has(1)).toBe(false);
    expect(cache.has(2)).toBe(false);
  });

  test("deletes specific page", () => {
    const cache = new GridPageCache(10);
    cache.set(1, { page: 1 });
    cache.set(2, { page: 2 });

    cache.delete(1);
    expect(cache.has(1)).toBe(false);
    expect(cache.has(2)).toBe(true);
    expect(cache.size).toBe(1);
  });
});
