import { useState } from 'react'

export type PageSize = 20 | 50 | 100 | 'all'

export const PAGE_SIZE_OPTIONS: PageSize[] = [20, 50, 100, 'all']

interface UsePaginationResult<T> {
  page: number
  pageSize: PageSize
  totalPages: number
  pageItems: T[]
  setPage: (page: number) => void
  setPageSize: (pageSize: PageSize) => void
}

export function usePagination<T>(
  items: T[],
  initialPageSize: PageSize = 20
): UsePaginationResult<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize)

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pageItems =
    pageSize === 'all' ? items : items.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handleSetPageSize(size: PageSize): void {
    setPageSize(size)
    setPage(1)
  }

  return {
    page: currentPage,
    pageSize,
    totalPages,
    pageItems,
    setPage,
    setPageSize: handleSetPageSize
  }
}
