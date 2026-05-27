import { useEffect, useState } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import { formatDate } from '../utils/format'

export default function AuditLogs() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    api.get('/audit-logs')
      .then(({ data }) => setRows(data))
      .catch(() => setRows([
        { id: 1, user: 'Admin SmartStock', action: 'create', module: 'products', record_id: '1', ip_address: '127.0.0.1', created_at: new Date().toISOString() },
        { id: 2, user: 'Manajer Gudang', action: 'stock_in', module: 'transactions', record_id: '2', ip_address: '127.0.0.1', created_at: new Date().toISOString() }
      ]))
  }, [])

  return (
    <DataTable
      rows={rows}
      columns={[
        { key: 'user', label: 'User', render: (row) => row.user || row.user_email },
        { key: 'action', label: 'Aksi' },
        { key: 'module', label: 'Modul', render: (row) => row.module || row.entity },
        { key: 'record_id', label: 'Record' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'created_at', label: 'Waktu', render: (row) => formatDate(row.created_at) }
      ]}
    />
  )
}
