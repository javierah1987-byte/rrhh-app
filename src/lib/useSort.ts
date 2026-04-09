import { useState, useMemo } from 'react'

export type SortDir = 'asc' | 'desc'
export type SortState<T> = { key: keyof T | null; dir: SortDir }

export function useSort<T extends Record<string, any>>(data: T[], defaultKey?: keyof T) {
  const [sort, setSort] = useState<SortState<T>>({ key: defaultKey || null, dir: 'asc' })

  function toggle(key: keyof T) {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sorted = useMemo(() => {
    if (!sort.key) return data
    return [...data].sort((a, b) => {
      const av = a[sort.key!], bv = b[sort.key!]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true, sensitivity: 'base' })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort])

  return { sorted, sort, toggle }
}
