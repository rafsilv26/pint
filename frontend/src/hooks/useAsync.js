import { useEffect, useEffectEvent, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { clearHttpCache } from '../services/http'

export function useAsync(fn, deps = []) {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  const isFirstRender = useRef(true)
  const dependencyKey = JSON.stringify(deps)
  const execute = useEffectEvent(() => fn())
  const errorMessage = useEffectEvent((error) => error.message || t('hooks.erroGenerico'))

  useEffect(() => {
    let alive = true

    Promise.resolve()
      .then(() => {
        if (!alive) return undefined

        if (isFirstRender.current) {
          setLoading(true)
        } else {
          setLoading(false)
        }

        setError(null)
        return execute()
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(errorMessage(e)))
      .finally(() => {
        if (alive) {
          setLoading(false)
          isFirstRender.current = false
        }
      })

    return () => {
      alive = false
    }

  }, [dependencyKey, tick])

  const reload = () => {
    clearHttpCache()
    setTick((t) => t + 1)
  }

  return { data, loading, error, reload }
}
