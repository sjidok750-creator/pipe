// ============================================================
// 프로젝트 관리 스토어 — 저장/불러오기/내보내기
// ============================================================
import { create } from 'zustand'
import { projectRepo } from '../lib/projectRepo.js'
import { storage } from '../lib/storage.js'
import { getSession } from '../lib/startup.js'
import { useStore } from './useStore.js'
import { useSeismicStore } from './useSeismicStore.js'

const SESSION_KEY = 'session'

const _session = getSession()

// ── JSON 직렬화 헬퍼 ─────────────────────────────────────────
function buildFileData(project) {
  return {
    app: 'PIPER',
    fileVersion: 1,
    exportedAt: new Date().toISOString(),
    project,
  }
}

function suggestFileName(project) {
  const moduleCode = project.meta.enabledModules
    .map(m => m === 'structural' ? 'S' : m === 'seismicPrelim' ? 'P' : 'D')
    .join('')
  const safeName = project.meta.name.replace(/[^\w가-힣\-]/g, '_')
  return `${safeName}_${moduleCode}.piper.json`
}

// ── 파일 시스템에 직접 쓰기 (핸들 보유 시) ───────────────────
async function writeToHandle(handle, json) {
  const { ensureWritePermission } = await import('../lib/fileHandleStore.js')
  const ok = await ensureWritePermission(handle)
  if (!ok) return false
  try {
    const writable = await handle.createWritable()
    await writable.write(json)
    await writable.close()
    return true
  } catch {
    return false
  }
}

// ── fallback: <a> 다운로드 ────────────────────────────────────
function downloadBlob(json, fileName) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export const useProjectStore = create((set, get) => ({
  // Project library (index only — lightweight)
  projects: projectRepo.list(),

  // Active project metadata
  projectId: _session?.projectId ?? null,
  projectName: _session?.projectName ?? '',
  enabledModules: _session?.enabledModules ?? [],
  fileName: _session?.fileName ?? null,   // 바인딩된 파일명 (표시용)

  // UI state
  isDirty: false,
  lastSavedAt: _session?.savedAt ?? null,
  isNewModalOpen: false,

  // ── Library ───────────────────────────────────────────────

  refreshLibrary: () => set({ projects: projectRepo.list() }),

  // ── New project modal ─────────────────────────────────────

  openNewModal: () => set({ isNewModalOpen: true }),
  closeNewModal: () => set({ isNewModalOpen: false }),

  // ── Discard current session ───────────────────────────────

  discardSession: () => {
    storage.remove(SESSION_KEY)
    useStore.getState().resetInputs()
    useSeismicStore.getState().resetPrelim()
    useSeismicStore.getState().resetDetail()
    set({ projectId: null, projectName: '', enabledModules: [], fileName: null, isDirty: false, lastSavedAt: null })
  },

  // ── Start fresh ───────────────────────────────────────────

  startNew: async (modules, name = '') => {
    if (modules.includes('structural')) useStore.getState().resetInputs()
    if (modules.includes('seismicPrelim')) useSeismicStore.getState().resetPrelim()
    if (modules.includes('seismicDetail')) useSeismicStore.getState().resetDetail()
    storage.remove(SESSION_KEY)
    set({
      projectId: null,
      projectName: name || '',
      enabledModules: modules,
      fileName: null,
      isDirty: false,
      lastSavedAt: null,
      isNewModalOpen: false,
    })
  },

  // ── Open saved project ────────────────────────────────────

  open: async (id) => {
    const project = projectRepo.get(id)
    if (!project) return

    if (project.modules.structural) {
      useStore.setState({
        inputs: project.modules.structural.inputs,
        result: project.modules.structural.result ?? null,
        calcError: null,
      })
    }
    if (project.modules.seismicPrelim) {
      useSeismicStore.setState({
        prelimInputs: project.modules.seismicPrelim.inputs,
        prelimResult: project.modules.seismicPrelim.result ?? null,
      })
    }
    if (project.modules.seismicDetail) {
      useSeismicStore.setState({
        detailInputs: project.modules.seismicDetail.inputs,
        detailResult: project.modules.seismicDetail.result ?? null,
      })
    }

    // 바인딩된 파일핸들 이름 복원 (IDB에서)
    let fileName = project.meta.fileName ?? null
    if (!fileName && typeof window.showSaveFilePicker === 'function') {
      try {
        const { loadHandle } = await import('../lib/fileHandleStore.js')
        const handle = await loadHandle(id)
        if (handle) fileName = handle.name
      } catch { /* ignore */ }
    }

    set({
      projectId: id,
      projectName: project.meta.name,
      enabledModules: project.meta.enabledModules,
      fileName,
      isDirty: false,
      lastSavedAt: project.meta.updatedAt,
    })
  },

  // ── Save to localStorage (+ 파일 핸들 있으면 파일에도 저장) ──

  save: async (overrideName) => {
    const { projectId, enabledModules, fileName: currentFileName } = get()
    const name = overrideName ?? get().projectName

    const structState = useStore.getState()
    const seismicState = useSeismicStore.getState()

    const modules = {}
    if (enabledModules.includes('structural')) {
      modules.structural = { inputs: structState.inputs, result: structState.result ?? null }
    }
    if (enabledModules.includes('seismicPrelim')) {
      modules.seismicPrelim = { inputs: seismicState.prelimInputs, result: seismicState.prelimResult ?? null }
    }
    if (enabledModules.includes('seismicDetail')) {
      modules.seismicDetail = { inputs: seismicState.detailInputs, result: seismicState.detailResult ?? null }
    }

    const now = new Date().toISOString()
    const existing = projectId ? projectRepo.get(projectId) : null
    const id = projectId ?? crypto.randomUUID()

    const project = {
      meta: {
        id,
        name: name || '새 프로젝트',
        createdAt: existing?.meta.createdAt ?? now,
        updatedAt: now,
        enabledModules,
        fileName: currentFileName ?? existing?.meta.fileName ?? null,
      },
      modules,
    }

    projectRepo.save(project)

    set({
      projectId: id,
      projectName: project.meta.name,
      isDirty: false,
      lastSavedAt: now,
      projects: projectRepo.list(),
    })

    // 파일 핸들 있으면 파일에도 자동 저장
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const { loadHandle } = await import('../lib/fileHandleStore.js')
        const handle = await loadHandle(id)
        if (handle) {
          const json = JSON.stringify(buildFileData(project), null, 2)
          await writeToHandle(handle, json)
        }
      } catch { /* ignore — 파일 저장 실패해도 localStorage는 완료 */ }
    }

    return id
  },

  // ── Rename ────────────────────────────────────────────────

  setProjectName: (name) => set({ projectName: name, isDirty: true }),

  // ── Mark dirty ────────────────────────────────────────────

  markDirty: () => set({ isDirty: true }),

  // ── Delete ────────────────────────────────────────────────

  deleteProject: async (id) => {
    projectRepo.delete(id)
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const { removeHandle } = await import('../lib/fileHandleStore.js')
        await removeHandle(id)
      } catch { /* ignore */ }
    }
    set({ projects: projectRepo.list() })
  },

  // ── 파일 탐색기로 저장 (첫 바인딩 또는 다른 이름으로 저장) ──

  saveToFile: async (id) => {
    // id 없으면 현재 세션을 먼저 localStorage에 저장
    const savedId = id ?? await get().save()
    if (!savedId) return

    const project = projectRepo.get(savedId)
    if (!project) return

    const json = JSON.stringify(buildFileData(project), null, 2)
    const suggested = suggestFileName(project)

    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const { saveHandle, loadHandle } = await import('../lib/fileHandleStore.js')

        // 이전 핸들을 startIn으로 활용
        let startIn
        try {
          const prev = await loadHandle(savedId)
          if (prev) startIn = prev
        } catch { /* ignore */ }

        const handle = await window.showSaveFilePicker({
          suggestedName: suggested,
          ...(startIn ? { startIn } : {}),
          types: [{ description: 'PIPER 프로젝트 파일', accept: { 'application/json': ['.json', '.piper.json'] } }],
        })

        await saveHandle(savedId, handle)

        const written = await writeToHandle(handle, json)
        if (!written) return

        // 파일명을 meta에도 저장
        const fileName = handle.name
        const updated = projectRepo.get(savedId)
        if (updated) {
          updated.meta.fileName = fileName
          projectRepo.save(updated)
        }

        set({ fileName, projects: projectRepo.list() })
        return savedId
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    // Fallback
    downloadBlob(json, suggested)
    return savedId
  },

  // ── 내보내기 (다른 이름으로 저장 — 항상 picker) ──────────────

  exportJSON: async (id) => {
    const project = projectRepo.get(id)
    if (!project) return

    const json = JSON.stringify(buildFileData(project), null, 2)
    const suggested = suggestFileName(project)

    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const { saveHandle, loadHandle } = await import('../lib/fileHandleStore.js')
        let startIn
        try {
          const prev = await loadHandle(id)
          if (prev) startIn = prev
        } catch { /* ignore */ }

        const handle = await window.showSaveFilePicker({
          suggestedName: suggested,
          ...(startIn ? { startIn } : {}),
          types: [{ description: 'PIPER 프로젝트 파일', accept: { 'application/json': ['.json', '.piper.json'] } }],
        })
        await saveHandle(id, handle)
        await writeToHandle(handle, json)

        const fileName = handle.name
        const updated = projectRepo.get(id)
        if (updated) { updated.meta.fileName = fileName; projectRepo.save(updated) }
        set({ projects: projectRepo.list() })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    downloadBlob(json, suggested)
  },

  // ── Import JSON ───────────────────────────────────────────

  importJSON: (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!['PIPER', 'STEP-PIPE'].includes(data.app) || !data.project) {
          throw new Error('올바른 PIPER 파일이 아닙니다.')
        }
        const project = data.project
        project.meta.id = crypto.randomUUID()
        project.meta.updatedAt = new Date().toISOString()
        projectRepo.save(project)
        set({ projects: projectRepo.list() })
        get().open(project.meta.id)
        resolve(project.meta.id)
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  }),
}))
