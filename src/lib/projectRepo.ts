import { storage } from './storage.js'

export type ModuleId = 'structural' | 'seismicPrelim' | 'seismicDetail'

export interface ModuleSnapshot {
  inputs: Record<string, unknown>
  result?: Record<string, unknown> | null
}

// ── 시설물 (관로 구간 1개) ────────────────────────────────────
export interface Facility {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  fileName?: string | null
  /** 최종보고서 서술정보 (측점·연장·시추주상도 등, 계산 대상 아님) */
  reportMeta?: Record<string, string> | null
  modules: {
    structural?: ModuleSnapshot
    seismicPrelim?: ModuleSnapshot
    seismicDetail?: ModuleSnapshot
  }
}

// ── 프로젝트 ─────────────────────────────────────────────────
export interface ProjectMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  enabledModules: ModuleId[]
  /** 최종보고서 표제 정보 (용역명·개별시설물명 등) */
  reportMeta?: Record<string, string> | null
}

export interface Project {
  meta: ProjectMeta
  facilities: Facility[]
}

// ── 파일 포맷 (시설물 단독 저장) ─────────────────────────────
export interface FacilityFile {
  app: 'PIPER'
  fileVersion: 2
  exportedAt: string
  projectName: string
  facility: Facility
  enabledModules: ModuleId[]
}

// ── 레거시 포맷 (v1 호환) ─────────────────────────────────────
export interface ProjectFile {
  app: 'PIPER' | 'STEP-PIPE'
  fileVersion: 1
  exportedAt: string
  project: {
    meta: ProjectMeta & { fileName?: string | null }
    modules: {
      structural?: ModuleSnapshot
      seismicPrelim?: ModuleSnapshot
      seismicDetail?: ModuleSnapshot
    }
  }
}

const INDEX_KEY = 'projects:index'
const pKey = (id: string) => `projects:${id}`

export const projectRepo = {
  list: (): ProjectMeta[] =>
    storage.get<ProjectMeta[]>(INDEX_KEY) ?? [],

  get: (id: string): Project | null =>
    storage.get<Project>(pKey(id)),

  save: (project: Project): void => {
    storage.set(pKey(project.meta.id), project)
    const index = projectRepo.list()
    const i = index.findIndex(m => m.id === project.meta.id)
    if (i >= 0) index[i] = project.meta
    else index.unshift(project.meta)
    storage.set(INDEX_KEY, index)
  },

  delete: (id: string): void => {
    storage.remove(pKey(id))
    storage.set(INDEX_KEY, projectRepo.list().filter(m => m.id !== id))
  },
}
