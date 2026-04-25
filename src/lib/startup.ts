/**
 * Synchronous startup routines — called once in main.tsx BEFORE React renders.
 * Ensures stores are hydrated from the last session before any component mounts.
 */

import { storage } from './storage.js'
import { projectRepo } from './projectRepo.js'
// Import stores to ensure they exist before we setState on them
import { useStore } from '../store/useStore.js'
import { useSeismicStore } from '../store/useSeismicStore.js'

export interface SessionData {
  projectId: string | null
  projectName: string
  enabledModules: string[]
  structural?: { inputs: Record<string, unknown>; result: unknown }
  seismicPrelim?: { inputs: Record<string, unknown>; result: unknown }
  seismicDetail?: { inputs: Record<string, unknown>; result: unknown }
  savedAt: string
}

const SESSION_KEY = 'session'

export function getSession(): SessionData | null {
  return storage.get<SessionData>(SESSION_KEY)
}

function runMigrations(): void {
  if (storage.get('migrated')) return

  // Migrate legacy pipecheck_history → project library
  try {
    const raw = localStorage.getItem('pipecheck_history')
    if (raw) {
      const history = JSON.parse(raw) as Array<{
        pipeType: string; DN: number; date: string
        inputs: Record<string, unknown>; result: Record<string, unknown>
      }>
      history.slice(0, 15).forEach(entry => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        projectRepo.save({
          meta: {
            id,
            name: `${entry.pipeType === 'steel' ? '강관' : '주철관'} DN${entry.DN}`,
            createdAt: now,
            updatedAt: now,
            enabledModules: ['structural'],
          },
          modules: {
            structural: { inputs: entry.inputs, result: entry.result },
          },
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
  runMigrations()
  restoreSession()
}
