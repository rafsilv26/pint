import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Hook para carregar dados de uma função assíncrona (ex: chamadas à api).
// Devolve { data, loading, error, reload }. `reload()` volta a executar fn.
export function useAsync(fn, deps = []) {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    Promise.resolve(fn())
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message || t('hooks.erroGenerico')))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = () => setTick((t) => t + 1)

  return { data, loading, error, reload }
}
