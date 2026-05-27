import { useMemo, useState } from 'react'
import LoadingState from './LoadingState'

export default function DataTable({ columns = [], rows = [], loading, error, empty = 'Belum ada data', actions, pageSize = 8 }) {
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const sortedRows = useMemo(() => {
    const copy = [...rows]
    if (!sortKey) return copy
    return copy.sort((a, b) => {
      const left = String(a[sortKey] ?? '').toLowerCase()
      const right = String(b[sortKey] ?? '').toLowerCase()
      return sortDir === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
    })
  }, [rows, sortDir, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function sort(column) {
    if (column.render) return
    if (sortKey === column.key) setSortDir((value) => value === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(column.key)
      setSortDir('asc')
    }
    setPage(1)
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <div className="card border-red-200 bg-red-50 p-8 text-center text-danger">{error}</div>
  }

  if (!rows.length) {
    return <div className="card p-8 text-center text-slate">{empty}</div>
  }

  return (
    <div className="card-static overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-background">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate">
                  <button type="button" className="font-bold uppercase tracking-wide" onClick={() => sort(column)}>
                    {column.label}{sortKey === column.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
              {actions && <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wide text-slate">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {pagedRows.map((row) => (
              <tr key={row.id || JSON.stringify(row)} className="transition hover:bg-background">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-navy">
                    {column.render ? column.render(row) : row[column.key] ?? '-'}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-slate">
          <span>Halaman {currentPage} dari {totalPages}</span>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1.5" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button>
            <button className="btn-secondary px-3 py-1.5" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
