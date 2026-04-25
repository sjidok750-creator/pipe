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

// Read session metadata synchronously at store creation time
const _session = getSession()

export const useProjectStore = create((set, get) => ({
  // Project library (index only — lightweight)
  projects: projectRepo.list(),

  // Active project metadata
  projectId: _session?.projectId ?? null,
  projectName: _session?.projectName ?? '',
  enabledModules: _session?.enabledModules ?? [],

  // UI state
  isDirty: false,
  lastSavedAt: _session?.savedAt ?? null,
  isNewModalOpen: false,

  // ── Library ───────────────────────────────────────────────

  refreshLibrary: () => set({ projects: projectRepo.list() }),

  // ── New project modal ─────────────────────────────────────

  openNewModal: () => set({ isNewModalOpen: true }),
  closeNewModal: () => set({ isNewModalOpen: false }),

  // ── Start fresh ───────────────────────────────────────────

  startNew: async (modules, name = '') => {
    if (modules.includes('structural')) useStore.getState().resetInputs()
    if (modules.includes('seismicPrelim')) useSeismicStore.getState().resetPrelim()
    if (modules.includes('seismicDetail')) useSeismicStore.getState().resetDetail()

    // Clear session so Home no longer shows a stale draft
    storage.remove(SESSION_KEY)

    set({
      projectId: null,
      projectName: name || '',
      enabledModules: modules,
      isDirty: false,
      lastSavedAt: null,
      isNewModalOpen: false,
    })
  },

  // ── Open saved project ────────────────────────────────────

  open: (id) => {
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

    set({
      projectId: id,
      projectName: project.meta.name,
      enabledModules: project.meta.enabledModules,
      isDirty: false,
      lastSavedAt: project.meta.updatedAt,
    })
  },

  // ── Save ─────────────────────────────────────────────────

  save: (overrideName) => {
    const { projectId, enabledModules } = get()
    const name = overrideName ?? get().projectName

    const structState = useStore.getState()
    const seismicState = useSeismicStore.getState()

    const modules = {}
    if (enabledModules.includes('structural')) {
      modules.structural = {
        inputs: structState.inputs,
        result: structState.result ?? null,
      }
    }
    if (enabledModules.includes('seismicPrelim')) {
      modules.seismicPrelim = {
        inputs: seismicState.prelimInputs,
        result: seismicState.prelimResult ?? null,
      }
    }
    if (enabledModules.includes('seismicDetail')) {
      modules.seismicDetail = {
        inputs: seismicState.detailInputs,
        result: seismicState.detailResult ?? null,
      }
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

    return id
  },

  // ── Rename ────────────────────────────────────────────────

  setProjectName: (name) => set({ projectName: name, isDirty: true }),

  // ── Mark dirty (called by SessionAutoSaver on store change) ──

  markDirty: () => set({ isDirty: true }),

  // ── Delete ────────────────────────────────────────────────

  deleteProject: (id) => {
    projectRepo.delete(id)
    set({ projects: projectRepo.list() })
  },

  // ── Export JSON ───────────────────────────────────────────

  exportJSON: (id) => {
    const project = projectRepo.get(id)
    if (!project) return

    const file = {
      app: 'STEP-PIPE',
      fileVersion: 1,
      exportedAt: new Date().toISOString(),
      project,
    }

    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = project.meta.name.replace(/[^\w가-힣\-]/g, '_')
    a.download = `${safeName}.steppipe.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  // ── Import JSON ───────────────────────────────────────────

  importJSON: (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.app !== 'STEP-PIPE' || !data.project) {
          throw new Error('올바른 STEP-PIPE 파일이 아닙니다.')
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
