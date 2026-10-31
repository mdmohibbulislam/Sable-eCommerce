import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import type { Category } from '../types'

let cache: Category[] | null = null

/** Categories rarely change, so they are fetched once and shared. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  const [loading, setLoading] = useState(cache === null)

  useEffect(() => {
    if (cache) return
    const controller = new AbortController()

    api
      .get<Category[]>('/categories/', { signal: controller.signal })
      .then((data) => {
        cache = data
        setCategories(data)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { categories, loading }
}

export function invalidateCategories() {
  cache = null
}
