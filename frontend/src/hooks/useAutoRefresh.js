import { useEffect, useRef } from 'react'

export function useAutoRefresh(callback, interval = 30_000, enabled = true) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return undefined
    const refresh = () => {
      if (document.visibilityState === 'visible') callbackRef.current()
    }
    const timer = window.setInterval(refresh, interval)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [enabled, interval])
}
