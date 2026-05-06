// ============================================================
// 프로젝트 관리 스토어 v2 — 프로젝트 > 시설물 구조
// ============================================================
import { create } from 'zustand'
import { projectRepo } from '../lib/projectRepo.js'
import { storage } from '../lib/storage.js'
import { getSession } from '../lib/startup.js'
import { useStore } from './useStore.js'
import { useSeismicStore } from './useSeismicStore.js'

const SESSION_KEY = 'session'
const _session = getSession()

// ── 헬퍼 ─────────────────────────────────────────────────────

function moduleCode(enabledModules) {
  return enabledModules
    .map(m => m === 'structural' ? 'S' : m === 'seismicPrelim' ? 'P' : 'D')
    .join('')
}

function buildFacilityFileData(projectName, enabledModules, facility) {
  return {
    app: 'PIPER',
    fileVersion: 2,
    exportedAt: new Date().toISOString(),
    projectName,
    enabledModules,
    facility,
  }
}

function downloadBlob(json, fileName) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

async function writeToHandle(handle, json) {
  const { ensureWritePermission } = await import('../lib/fileHandleStore.js')
  if (!await ensureWritePermission(handle)) return false
  try {
    const writable = await handle.createWritable()
    await writable.write(json)
    await writable.close()
    return true
  } catch { return false }
}

// 활성 시설물 → useStore/useSeismicStore 에 반영
function loadFacilityToStores(facility, enabledModules) {
  if (enabledModules.includes('structural') && facility.modules.structural) {
    useStore.setState({
      inputs: facility.modules.structural.inputs,
      result: facility.modules.structural.result ?? null,
      calcError: null,
    })
  } else {
    useStore.getState().resetInputs()
  }
  if (enabledModules.includes('seismicPrelim') && facility.modules.seismicPrelim) {
    useSeismicStore.setState({
      prelimInputs: facility.modules.seismicPrelim.inputs,
      prelimResult: facility.modules.seismicPrelim.result ?? null,
    })
  } else {
    useSeismicStore.getState().resetPrelim()
  }
  if (enabledModules.includes('seismicDetail') && facility.modules.seismicDetail) {
    useSeismicStore.setState({
      detailInputs: facility.modules.seismicDetail.inputs,
      detailResult: facility.modules.seismicDetail.result ?? null,
    })
  } else {
    useSeismicStore.getState().resetDetail()
  }
}

// 현재 스토어 상태 → 시설물 modules 스냅샷
function snapshotModules(enabledModules) {
  const s = useStore.getState()
  const q = useSeismicStore.getState()
  const modules = {}
  if (enabledModules.includes('structural'))
    modules.structural = { inputs: s.inputs, result: s.result ?? null }
  if (enabledModules.includes('seismicPrelim'))
    modules.seismicPrelim = { inputs: q.prelimInputs, result: q.prelimResult ?? null }
  if (enabledModules.includes('seismicDetail'))
    modules.seismicDetail = { inputs: q.detailInputs, result: q.detailResult ?? null }
  return modules
}

// ── 스토어 ────────────────────────────────────────────────────

export const useProjectStore = create((set, get) => ({
  // 프로젝트 목록 (인덱스)
  projects: projectRepo.list(),

  // 활성 프로젝트
  projectId: _session?.projectId ?? null,
  projectName: _session?.projectName ?? '',
  enabledModules: _session?.enabledModules ?? [],

  // 활성 시설물
  activeFacilityId: _session?.activeFacilityId ?? null,
  activeFacilityName: '',

  // UI 상태
  isDirty: false,
  lastSavedAt: _session?.savedAt ?? null,
  isNewModalOpen: false,

  // ── Library ─────────────────────────────────────────────────

  refreshLibrary: () => set({ projects: projectRepo.list() }),

  openNewModal: () => set({ isNewModalOpen: true }),
  closeNewModal: () => set({ isNewModalOpen: false }),

  // ── 세션 파기 ────────────────────────────────────────────────

  discardSession: () => {
    storage.remove(SESSION_KEY)
    useStore.getState().resetInputs()
    useSeismicStore.getState().resetPrelim()
    useSeismicStore.getState().resetDetail()
    set({
      projectId: null, projectName: '', enabledModules: [],
      activeFacilityId: null, activeFacilityName: '',
      isDirty: false, lastSavedAt: null,
    })
  },

  // ── 새 프로젝트 시작 ─────────────────────────────────────────

  startNew: async (modules, projectName = '', facilityName = '') => {
    useStore.getState().resetInputs()
    useSeismicStore.getState().resetPrelim()
    useSeismicStore.getState().resetDetail()
    storage.remove(SESSION_KEY)

    const facilityId = crypto.randomUUID()
    set({
      projectId: null,
      projectName: projectName || '',
      enabledModules: modules,
      activeFacilityId: facilityId,
      activeFacilityName: facilityName || '시설물 001',
      isDirty: false,
      lastSavedAt: null,
      isNewModalOpen: false,
    })
  },

  // ── 프로젝트 열기 ────────────────────────────────────────────

  open: async (id, facilityId = null) => {
    const project = projectRepo.get(id)
    if (!project || project.facilities.length === 0) return

    const facility = facilityId
      ? project.facilities.find(f => f.id === facilityId) ?? project.facilities[0]
      : project.facilities[0]

    loadFacilityToStores(facility, project.meta.enabledModules)

    set({
      projectId: id,
      projectName: project.meta.name,
      enabledModules: project.meta.enabledModules,
      activeFacilityId: facility.id,
      activeFacilityName: facility.name,
      isDirty: false,
      lastSavedAt: facility.updatedAt,
    })
  },

  // ── 시설물 전환 ──────────────────────────────────────────────

  switchFacility: async (facilityId) => {
    const { projectId, enabledModules } = get()
    if (!projectId) return

    // 현재 시설물 먼저 저장
    await get().save()

    const project = projectRepo.get(projectId)
    if (!project) return
    const facility = project.facilities.find(f => f.id === facilityId)
    if (!facility) return

    loadFacilityToStores(facility, enabledModules)
    set({
      activeFacilityId: facility.id,
      activeFacilityName: facility.name,
      isDirty: false,
      lastSavedAt: facility.updatedAt,
    })
  },

  // ── 시설물 추가 ──────────────────────────────────────────────

  addFacility: async (name) => {
    const { projectId, enabledModules } = get()

    // 현재 시설물 저장
    await get().save()

    // 새 시설물로 초기화
    useStore.getState().resetInputs()
    useSeismicStore.getState().resetPrelim()
    useSeismicStore.getState().resetDetail()

    const facilityId = crypto.randomUUID()
    const now = new Date().toISOString()

    if (projectId) {
      const project = projectRepo.get(projectId)
      if (project) {
        const newFacility = {
          id: facilityId,
          name,
          createdAt: now,
          updatedAt: now,
          modules: {},
        }
        project.facilities.push(newFacility)
        project.meta.updatedAt = now
        projectRepo.save(project)
      }
    }

    set({
      activeFacilityId: facilityId,
      activeFacilityName: name,
      isDirty: false,
      lastSavedAt: null,
      projects: projectRepo.list(),
    })

    return facilityId
  },

  // ── 시설물 이름 변경 ─────────────────────────────────────────

  setFacilityName: (name) => set({ activeFacilityName: name, isDirty: true }),

  // ── 저장 (localStorage + 파일 핸들 있으면 파일도) ────────────

  save: async (overrideProjectName) => {
    const { projectId, projectName, enabledModules, activeFacilityId, activeFacilityName } = get()
    const pName = overrideProjectName ?? projectName

    if (!activeFacilityId) return null

    const now = new Date().toISOString()
    const modules = snapshotModules(enabledModules)

    const existingProject = projectId ? projectRepo.get(projectId) : null
    const id = projectId ?? crypto.randomUUID()

    const existingFacility = existingProject?.facilities.find(f => f.id === activeFacilityId)
    const updatedFacility = {
      id: activeFacilityId,
      name: activeFacilityName || '시설물 001',
      createdAt: existingFacility?.createdAt ?? now,
      updatedAt: now,
      fileName: existingFacility?.fileName ?? null,
      modules,
    }

    // 기존 시설물 목록에서 현재 시설물 교체
    let facilities = existingProject?.facilities ?? []
    const fi = facilities.findIndex(f => f.id === activeFacilityId)
    if (fi >= 0) {
      facilities = [...facilities]
      facilities[fi] = updatedFacility
    } else {
      facilities = [...facilities, updatedFacility]
    }

    const project = {
      meta: {
        id,
        name: pName || '새 프로젝트',
        createdAt: existingProject?.meta.createdAt ?? now,
        updatedAt: now,
        enabledModules,
      },
      facilities,
    }

    projectRepo.save(project)

    set({
      projectId: id,
      projectName: project.meta.name,
      isDirty: false,
      lastSavedAt: now,
      projects: projectRepo.list(),
    })

    // 파일 핸들 있으면 자동으로 파일에도 저장
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const { loadHandle } = await import('../lib/fileHandleStore.js')
        const handle = await loadHandle(activeFacilityId)
        if (handle) {
          const json = JSON.stringify(buildFacilityFileData(project.meta.name, enabledModules, updatedFacility), null, 2)
          await writeToHandle(handle, json)
        }
      } catch { /* ignore */ }
    }

    return id
  },

  // ── 시설물 파일 저장 (탐색기) ───────────────────────────────

  saveFacilityToFile: async () => {
    const savedId = await get().save()
    if (!savedId) return

    const { activeFacilityId, activeFacilityName, projectName, enabledModules } = get()
    const project = projectRepo.get(savedId)
    if (!project) return

    const facility = project.facilities.find(f => f.id === activeFacilityId)
    if (!facility) return

    const json = JSON.stringify(buildFacilityFileData(projectName, enabledModules, facility), null, 2)
    const safeName = (activeFacilityName || '시설물').replace(/[^\w가-힣\-]/g, '_')
    const code = moduleCode(enabledModules)
    const suggested = `${safeName}_${code}.piper.json`

    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const { saveHandle, loadHandle } = await import('../lib/fileHandleStore.js')
        let startIn
        try {
          const prev = await loadHandle(activeFacilityId)
          if (prev) startIn = prev
        } catch { /* ignore */ }

        const handle = await window.showSaveFilePicker({
          suggestedName: suggested,
          ...(startIn ? { startIn } : {}),
          types: [{ description: 'PIPER 시설물 파일', accept: { 'application/json': ['.json', '.piper.json'] } }],
        })

        await saveHandle(activeFacilityId, handle)
        await writeToHandle(handle, json)

        // fileName 업데이트
        const p = projectRepo.get(savedId)
        if (p) {
          const fi = p.facilities.findIndex(f => f.id === activeFacilityId)
          if (fi >= 0) {
            p.facilities[fi].fileName = handle.name
            projectRepo.save(p)
          }
        }

        set({ projects: projectRepo.list() })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    downloadBlob(json, suggested)
  },

  // ── 프로젝트 전체 저장 (폴더 선택 → 시설물별 파일) ──────────

  saveProjectToFolder: async () => {
    const savedId = await get().save()
    if (!savedId) return

    const { projectName, enabledModules } = get()
    const project = projectRepo.get(savedId)
    if (!project) return

    if (typeof window.showDirectoryPicker !== 'function') {
      // fallback: 시설물별 개별 다운로드
      for (const facility of project.facilities) {
        const json = JSON.stringify(buildFacilityFileData(projectName, enabledModules, facility), null, 2)
        const safeName = facility.name.replace(/[^\w가-힣\-]/g, '_')
        downloadBlob(json, `${safeName}_${moduleCode(enabledModules)}.piper.json`)
      }
      return
    }

    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })

      for (const facility of project.facilities) {
        const json = JSON.stringify(buildFacilityFileData(projectName, enabledModules, facility), null, 2)
        const safeName = facility.name.replace(/[^\w가-힣\-]/g, '_')
        const fileName = `${safeName}_${moduleCode(enabledModules)}.piper.json`

        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(json)
        await writable.close()

        // 각 시설물 핸들 업데이트
        const { saveHandle } = await import('../lib/fileHandleStore.js')
        await saveHandle(facility.id, fileHandle)

        // fileName 업데이트
        const p = projectRepo.get(savedId)
        if (p) {
          const fi = p.facilities.findIndex(f => f.id === facility.id)
          if (fi >= 0) { p.facilities[fi].fileName = fileName; projectRepo.save(p) }
        }
      }

      set({ projects: projectRepo.list() })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
    }
  },

  // ── 이름 변경 ────────────────────────────────────────────────

  setProjectName: (name) => set({ projectName: name, isDirty: true }),

  markDirty: () => set({ isDirty: true }),

  // ── 시설물 삭제 ──────────────────────────────────────────────

  deleteFacility: async (projectId, facilityId) => {
    const project = projectRepo.get(projectId)
    if (!project) return
    project.facilities = project.facilities.filter(f => f.id !== facilityId)
    project.meta.updatedAt = new Date().toISOString()
    projectRepo.save(project)

    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const { removeHandle } = await import('../lib/fileHandleStore.js')
        await removeHandle(facilityId)
      } catch { /* ignore */ }
    }
    set({ projects: projectRepo.list() })
  },

  // ── 프로젝트 삭제 ────────────────────────────────────────────

  deleteProject: async (id) => {
    const project = projectRepo.get(id)
    if (project && typeof window.showSaveFilePicker === 'function') {
      try {
        const { removeHandle } = await import('../lib/fileHandleStore.js')
        for (const f of project.facilities) await removeHandle(f.id)
      } catch { /* ignore */ }
    }
    projectRepo.delete(id)
    set({ projects: projectRepo.list() })
  },

  // ── 파일에서 불러오기 ────────────────────────────────────────

  importJSON: (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)

        // v2: 시설물 단독 파일
        if (data.app === 'PIPER' && data.fileVersion === 2 && data.facility) {
          const now = new Date().toISOString()
          const facilityId = crypto.randomUUID()
          const projectId = crypto.randomUUID()
          const facility = { ...data.facility, id: facilityId, updatedAt: now }
          const project = {
            meta: {
              id: projectId,
              name: data.projectName || '가져온 프로젝트',
              createdAt: now,
              updatedAt: now,
              enabledModules: data.enabledModules ?? [],
            },
            facilities: [facility],
          }
          projectRepo.save(project)
          const { projects: _ } = useProjectStore.getState()
          useProjectStore.setState({ projects: projectRepo.list() })
          useProjectStore.getState().open(projectId, facilityId)
          resolve(projectId)
          return
        }

        // v1 레거시: 프로젝트 단독 파일
        if (['PIPER', 'STEP-PIPE'].includes(data.app) && data.project) {
          const now = new Date().toISOString()
          const projectId = crypto.randomUUID()
          const facilityId = crypto.randomUUID()
          const v1 = data.project
          const project = {
            meta: { ...v1.meta, id: projectId, updatedAt: now },
            facilities: [{
              id: facilityId,
              name: '기본 시설물',
              createdAt: now,
              updatedAt: now,
              modules: v1.modules ?? {},
            }],
          }
          projectRepo.save(project)
          useProjectStore.setState({ projects: projectRepo.list() })
          useProjectStore.getState().open(projectId, facilityId)
          resolve(projectId)
          return
        }

        throw new Error('올바른 PIPER 파일이 아닙니다.')
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  }),

  // ── 내보내기 (다른 이름으로) ─────────────────────────────────

  exportJSON: async (projectId, facilityId) => {
    const project = projectRepo.get(projectId)
    if (!project) return
    const facility = facilityId
      ? project.facilities.find(f => f.id === facilityId)
      : project.facilities[0]
    if (!facility) return

    const json = JSON.stringify(
      buildFacilityFileData(project.meta.name, project.meta.enabledModules, facility),
      null, 2
    )
    const safeName = facility.name.replace(/[^\w가-힣\-]/g, '_')
    const suggested = `${safeName}_${moduleCode(project.meta.enabledModules)}.piper.json`

    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: suggested,
          types: [{ description: 'PIPER 시설물 파일', accept: { 'application/json': ['.json', '.piper.json'] } }],
        })
        await writeToHandle(handle, json)
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    downloadBlob(json, suggested)
  },
}))
