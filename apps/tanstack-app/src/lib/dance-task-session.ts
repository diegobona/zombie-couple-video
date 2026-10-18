// Keep only the task reference in this tab, never the user's selected photos.
const prefix = 'zombie-couple:last-task:'
const maxAge = 24 * 60 * 60 * 1000
type TaskStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function rememberDanceTask(storage: TaskStorage, userId: string, taskId: string, now = Date.now()) {
  try { storage.setItem(prefix + userId, JSON.stringify({ taskId, savedAt: now })) } catch { /* Storage can be disabled; the current job can still finish. */ }
}

export function forgetDanceTask(storage: TaskStorage, userId: string) {
  try { storage.removeItem(prefix + userId) } catch { /* No browser storage available. */ }
}

export function readDanceTask(storage: TaskStorage, userId: string, now = Date.now()): string | null {
  try {
    const raw = storage.getItem(prefix + userId)
    if (!raw) return null
    const record: unknown = JSON.parse(raw)
    if (record && typeof record === 'object' && 'taskId' in record && 'savedAt' in record
      && typeof record.taskId === 'string' && /^[\w-]{1,128}$/.test(record.taskId)
      && typeof record.savedAt === 'number' && record.savedAt <= now && now - record.savedAt < maxAge) return record.taskId
    forgetDanceTask(storage, userId)
  } catch { forgetDanceTask(storage, userId) }
  return null
}
