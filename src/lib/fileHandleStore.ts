/**
 * IndexedDB에 FileSystemFileHandle을 프로젝트별로 저장/복원.
 * 핸들은 페이지 새로고침 후에도 유지되지만 permission은 재확인 필요.
 */

const DB_NAME = 'piper-fs'
const STORE_NAME = 'handles'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveHandle(projectId: string, handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, `handle:${projectId}`)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadHandle(projectId: string): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(`handle:${projectId}`)
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function removeHandle(projectId: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(`handle:${projectId}`)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { /* ignore */ }
}

/** 핸들에 쓰기 권한 확인/요청. 없으면 false 반환 */
export async function ensureWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  try {
    const perm = await handle.queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return true
    const req = await handle.requestPermission({ mode: 'readwrite' })
    return req === 'granted'
  } catch {
    return false
  }
}
