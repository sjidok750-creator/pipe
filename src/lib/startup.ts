/**
 * Synchronous startup routines — called once in main.tsx BEFORE React renders.
 */

import { storage } from './storage.js'
import { projectRepo } from './projectRepo.js'
import { useStore } from '../store/useStore.js'
import { useSeismicStore } from '../store/useSeismicStore.js'
import type { Project, Facility } from './projectRepo.js'

export interface SessionData {
  projectId: string | null
  projectName: string
  enabledModules: string[]
  activeFacilityId: string | null
  // 활성 시설물 입력값 캐시
  structural?: { inputs: Record<string, unknown>; result: unknown }
  seismicPrelim?: { inputs: Record<string, unknown>; result: unknown }
  seismicDetail?: { inputs: Record<string, unknown>; result: unknown }
  savedAt: string
}

const SESSION_KEY = 'session'

export function getSession(): SessionData | null {
  return storage.get<SessionData>(SESSION_KEY)
}

// ── v1 → v2 마이그레이션: modules 직접 → facilities 배열 ─────
function migrateV1toV2(): void {
  if (storage.get('migrated:v2')) return

  const index = storage.get<Array<{ id: string }>>('projects:index') ?? []
  for (const meta of index) {
    const raw = storage.get<unknown>(`projects:${meta.id}`)
    if (!raw || typeof raw !== 'object') continue
    const proj = raw as Record<string, unknown>

    // 이미 v2 구조(facilities 배열)이면 skip
    if (Array.isArray((proj as Record<string, unknown>).facilities)) continue

    // v1 구조: { meta, modules }
    const v1 = proj as { meta: Record<string, unknown>; modules: Record<string, unknown> }
    const facilityId = crypto.randomUUID()
    const now = new Date().toISOString()

    const facility: Facility = {
      id: facilityId,
      name: '기본 시설물',
      createdAt: v1.meta.createdAt as string ?? now,
      updatedAt: v1.meta.updatedAt as string ?? now,
      fileName: (v1.meta.fileName as string) ?? null,
      modules: v1.modules as Facility['modules'],
    }

    const v2: Project = {
      meta: {
        id: v1.meta.id as string,
        name: v1.meta.name as string,
        createdAt: v1.meta.createdAt as string ?? now,
        updatedAt: v1.meta.updatedAt as string ?? now,
        enabledModules: (v1.meta.enabledModules as string[]) ?? [],
      },
      facilities: [facility],
    }

    projectRepo.save(v2)
  }

  storage.set('migrated:v2', true)
}

// ── 레거시 pipecheck_history 마이그레이션 ─────────────────────
function migrateV0(): void {
  if (storage.get('migrated')) return

  try {
    const raw = localStorage.getItem('pipecheck_history')
    if (raw) {
      const history = JSON.parse(raw) as Array<{
        pipeType: string; DN: number; date: string
        inputs: Record<string, unknown>; result: Record<string, unknown>
      }>
      history.slice(0, 15).forEach(entry => {
        const id = crypto.randomUUID()
        const facilityId = crypto.randomUUID()
        const now = new Date().toISOString()
        projectRepo.save({
          meta: {
            id,
            name: `${entry.pipeType === 'steel' ? '강관' : '주철관'} DN${entry.DN}`,
            createdAt: now,
            updatedAt: now,
            enabledModules: ['structural'],
          },
          facilities: [{
            id: facilityId,
            name: '기본 시설물',
            createdAt: now,
            updatedAt: now,
            modules: {
              structural: { inputs: entry.inputs, result: entry.result },
            },
          }],
        })
      })
    }
  } catch (e) {
    console.warn('[startup] legacy migration failed:', e)
  }

  storage.set('migrated', 'v1')
}

function restoreSession(): void {
  const session = getSession()
  if (!session) return

  try {
    if (session.structural?.inputs) {
      useStore.setState({
        inputs: session.structural.inputs as never,
        result: (session.structural.result as never) ?? null,
        calcError: null,
      })
    }
    if (session.seismicPrelim?.inputs) {
      useSeismicStore.setState({
        prelimInputs: session.seismicPrelim.inputs as never,
        prelimResult: (session.seismicPrelim.result as never) ?? null,
      })
    }
    if (session.seismicDetail?.inputs) {
      useSeismicStore.setState({
        detailInputs: session.seismicDetail.inputs as never,
        detailResult: (session.seismicDetail.result as never) ?? null,
      })
    }
  } catch (e) {
    console.warn('[startup] session restore failed:', e)
  }
}

export function runStartup(): void {
  migrateV0()
  migrateV1toV2()
  restoreSession()
}
