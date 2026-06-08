import { useEffect, useState } from 'react'

// Hook simples para carregar dados de uma função assíncrona (ex: chamadas à api mock).
// Devolve { data, loading, error } e evita atualizar estado após desmontar.
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    Promise.resolve(fn())
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message || 'Ocorreu um erro.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
