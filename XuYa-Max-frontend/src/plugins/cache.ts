/**
 * 本地存储封装（localStorage / sessionStorage）
 * 移植自 plus-ui/src/plugins/cache.ts，用于请求防重复提交等场景。
 *
 * @module plugins/cache
 */

interface CacheInstance {
  set<T>(key: string, value: T): void
  get<T = any>(key: string): T | null
  setJSON<T>(key: string, value: T): void
  getJSON<T = any>(key: string): T | null
  remove(key: string): void
  clear(): void
}

const createCache = (storage: Storage): CacheInstance => ({
  set<T>(key: string, value: T) {
    storage.setItem(key, value as any)
  },
  get<T = any>(key: string): T | null {
    const value = storage.getItem(key)
    return value as unknown as T | null
  },
  setJSON<T>(key: string, value: T) {
    storage.setItem(key, JSON.stringify(value))
  },
  getJSON<T = any>(key: string): T | null {
    const value = storage.getItem(key)
    if (value === null || value === undefined) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  },
  remove(key: string) {
    storage.removeItem(key)
  },
  clear() {
    storage.clear()
  }
})

const local = createCache(window.localStorage)
const session = createCache(window.sessionStorage)

export default { local, session }
