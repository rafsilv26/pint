import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

// Hook para carregar dados de uma função assíncrona (ex: chamadas à api).
// Devolve { data, loading, error, reload }. `reload()` volta a executar fn.
export function useAsync(fn, deps = []) {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true) // Primeiro tick começa a true
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)
  
  // Referência para identificar se é a primeira execução
  const isFirstRender = useRef(true)

  useEffect(() => {
    let alive = true
    
    Promise.resolve()
      .then(() => {
        if (!alive) return undefined
        
        // Se não for a primeira execução, o loading mantém-se false
        if (isFirstRender.current) {
          setLoading(true)
        } else {
          setLoading(false)
        }
        
        setError(null)
        return fn()
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message || t('hooks.erroGenerico')))
      .finally(() => {
        if (alive) {
          setLoading(false)
          isFirstRender.current = false // Desativa após a primeira execução completa
        }
      })
      
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = () => setTick((t) => t + 1)

  return { data, loading, error, reload }
}
