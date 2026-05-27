import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'

const rows = [
  { id: 1, version: '1.0.0', date: '2026-05-27', feature: 'Starter MVP', notes: 'Login role, dashboard, CRUD, transaksi, transfer, laporan, log, monitoring.' },
  { id: 2, version: '1.1.0', date: '2026-05-27', feature: 'UI Stitch AI', notes: 'Sidebar fixed, navbar atas, card statistik, tabel responsif, modal reusable.' },
  { id: 3, version: '1.2.0', date: '2026-05-27', feature: 'Dokumentasi BNSP', notes: 'Menambah dokumen risiko, migrasi, WBS, quality checklist, dan FAQ.' }
]

export default function ChangeLog() {
  return (
    <div className="space-y-6">
      <PageHeader title="Change Log" description="Catatan versi dan perubahan project SmartStock Pro." />
      <DataTable
        rows={rows}
        columns={[
          { key: 'version', label: 'Versi' },
          { key: 'date', label: 'Tanggal' },
          { key: 'feature', label: 'Fitur' },
          { key: 'notes', label: 'Catatan' }
        ]}
      />
    </div>
  )
}
