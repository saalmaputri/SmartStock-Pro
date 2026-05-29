import { useEffect, useState } from 'react'
import { Download, Play, Upload } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { formatNumber } from '../utils/format'

export default function Reports() {
  const [stocks, setStocks] = useState([])
  const [file, setFile] = useState(null)
  const [importLogs, setImportLogs] = useState([])
  const [jobs, setJobs] = useState([])
  const totalStock = stocks.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  useEffect(() => {
    api.get('/stocks')
      .then(({ data }) => setStocks(data))
      .catch(() => setStocks([]))
    loadJobs()
  }, [])

  async function loadJobs() {
    api.get('/jobs').then(({ data }) => setJobs(Array.isArray(data) ? data : [])).catch(() => null)
  }

  async function exportPdf() {
    if (!await confirmAction('Export laporan stok ke PDF sekarang?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/reports/stock/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'laporan-stok.pdf')
  }

  async function exportExcel() {
    if (!await confirmAction('Export laporan stok ke Excel/CSV sekarang?', { confirmText: 'Export' })) return
    const response = await api.get('/reports/stock/excel', { responseType: 'blob' })
    downloadBlob(response.data, 'laporan-stok.csv')
  }

  async function importCsv() {
    if (!file) return
    if (!await confirmAction(`Import produk dari file "${file.name}"? Data produk baru akan ditambahkan.`, { confirmText: 'Import' })) return
    const form = new FormData()
    form.append('file', file)
    await api.post('/products/import-csv', form)
    setImportLogs((rows) => [{ id: Date.now(), filename: file.name, status: 'success', created_at: new Date().toISOString() }, ...rows])
    setFile(null)
  }

  async function generateBackgroundReport() {
    if (!await confirmAction('Buat background job untuk generate laporan PDF?', { confirmText: 'Buat Job' })) return
    const { data } = await api.post('/reports/stock/pdf/jobs')
    setJobs((rows) => [data, ...rows])
    setTimeout(loadJobs, 1500)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Halaman Laporan" description="Ringkasan stok, export PDF, dan import CSV produk untuk kebutuhan demo." />
      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Baris Laporan" value={formatNumber(stocks.length)} />
        <StatCard title="Total Stok" value={formatNumber(totalStock)} />
        <StatCard title="Format CSV" value="UTF-8" />
      </section>
      <section className="card grid gap-6 p-6 xl:grid-cols-[1fr_360px]">
        <div>
          <h2 className="section-title">Ringkasan Laporan Stok</h2>
          <p className="mt-1 text-sm text-slate">Gunakan tombol export untuk menghasilkan PDF laporan stok. Import CSV memakai format sederhana untuk demo BNSP.</p>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-blue-soft p-4 text-sm text-navy">sku,name,category_name,supplier_name,min_stock,price{'\n'}SKU-001,Kabel LAN,Elektronik,PT Demo,15,25000</pre>
        </div>
        <div className="grid content-start gap-3">
          <button className="btn-primary" onClick={exportPdf}><Download size={18} /> Export PDF</button>
          <button className="btn-secondary" onClick={generateBackgroundReport}><Play size={18} /> Generate PDF Background</button>
          <button className="btn-secondary" onClick={exportExcel}><Download size={18} /> Export Excel</button>
          <input className="field py-2" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0])} />
          <button className="btn-secondary" disabled={!file} onClick={importCsv}><Upload size={18} /> Import CSV Produk</button>
        </div>
      </section>
      <DataTable
        rows={stocks}
        columns={[
          { key: 'sku', label: 'SKU' },
          { key: 'product_name', label: 'Produk' },
          { key: 'warehouse_name', label: 'Gudang' },
          { key: 'quantity', label: 'Stok' },
          { key: 'min_stock', label: 'Min Stok' }
        ]}
      />
      <DataTable
        rows={importLogs}
        empty="Belum ada riwayat import pada sesi ini."
        columns={[
          { key: 'filename', label: 'File' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Waktu' }
        ]}
      />
      <DataTable
        rows={jobs}
        empty="Belum ada background job laporan."
        columns={[
          { key: 'type', label: 'Job' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Dibuat' },
          { key: 'finished_at', label: 'Selesai' }
        ]}
      />
    </div>
  )
}
