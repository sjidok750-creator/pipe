import { storage } from './storage.js'

export type ModuleId = 'structural' | 'seismicPrelim' | 'seismicDetail'

export interface ModuleSnapshot {
  inputs: Record<string, unknown>
  result?: Record<string, unknown> | null
}

export interface ProjectMeta {
  id: string
  name: string
  createdAt: string  // ISO 8601
  updatedAt: string
  enabledModules: ModuleId[]
}

export interface Project {
  meta: ProjectMeta
  modules: {
    structural?: ModuleSnapshot
    seismicPrelim?: ModuleSnapshot
    seismicDetail?: ModuleSnapshot
  }
}

export interface ProjectFile {
  app: 'STEP-PIPE'
  fileVersion: 1
  exportedAt: string
  project: Project
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
