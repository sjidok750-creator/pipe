/**
 * Mounts invisibly in App — watches all store changes and debounces
 * an auto-save to the session slot every 500 ms.
 */
import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore.js'
import { useSeismicStore } from '../store/useSeismicStore.js'
import { useProjectStore } from '../store/useProjectStore.js'
import { storage } from '../lib/storage.js'

const SESSION_KEY = 'session'

export default function SessionAutoSaver() {
  const inputs       = useStore(s => s.inputs)
  const result       = useStore(s => s.result)
  const prelimInputs = useSeismicStore(s => s.prelimInputs)
  const prelimResult = useSeismicStore(s => s.prelimResult)
  const detailInputs = useSeismicStore(s => s.detailInputs)
  const detailResult = useSeismicStore(s => s.detailResult)

  const { projectId, projectName, enabledModules, markDirty } = useProjectStore()

  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip the very first render (which reflects the restored session values)
    if (isFirstRender.current) { isFirstRender.current = false; return }

    markDirty()

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      storage.set(SESSION_KEY, {
        projectId,
        projectName,
        enabledModules,
        structural:   { inputs, result },
        seismicPrelim: { inputs: prelimInputs, result: prelimResult },
        seismicDetail: { inputs: detailInputs, result: detailResult },
        savedAt: new Date().toISOString(),
      })
    }, 500)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, result, prelimInputs, prelimResult, detailInputs, detailResult])

  return null
}
