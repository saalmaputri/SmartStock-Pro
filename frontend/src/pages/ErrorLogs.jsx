import { useEffect, useState } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import { formatDate } from '../utils/format'

function SeverityBadge({ severity }) {
  const map = {
    critical: 'bg-red-50 text-danger border-red-200',
    warning: 'bg-orange-50 text-warning border-orange-200',
    info: 'bg-blue-soft text-navy border-line'
  }
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${map[severity] || map.info}`}>{severity}</span>
}

export default function ErrorLogs() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    api.get('/error-logs')
      .then(({ data }) => setRows(data))
      .catch(() => setRows([]))
  }, [])

  return (
    <DataTable
      rows={rows}
      columns={[
        { key: 'severity', label: 'Severity', render: (row) => <SeverityBadge severity={row.severity} /> },
        { key: 'message', label: 'Pesan' },
        { key: 'module', label: 'Module' },
        { key: 'path', label: 'Path' },
        { key: 'method', label: 'Method' },
        { key: 'created_at', label: 'Waktu', render: (row) => formatDate(row.created_at) }
      ]}
    />
  )
}
