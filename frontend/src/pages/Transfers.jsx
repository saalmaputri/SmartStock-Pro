import { useEffect, useState } from 'react'
import { Check, Download, X } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { errorMessage, formatDate } from '../utils/format'
import { getUser } from '../utils/auth'

export default function Transfers() {
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', target_warehouse_id: '', quantity: 1, notes: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = getUser()
  const canApprove = ['Admin', 'Manajer Gudang'].includes(user.role)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [transferRes, productRes, warehouseRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/products'),
        api.get('/warehouses')
      ])
      setRows(Array.isArray(transferRes.data) ? transferRes.data : [])
      setProducts(Array.isArray(productRes.data) ? productRes.data : productRes.data.items || [])
      setWarehouses(Array.isArray(warehouseRes.data) ? warehouseRes.data : warehouseRes.data.items || [])
    } catch (err) {
      setRows([])
      setProducts([])
      setWarehouses([])
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submit(event) {
    event.preventDefault()
    if (!await confirmAction('Ajukan transfer stok antar gudang ini? Stok akan diperbarui setelah disetujui Admin atau Manajer Gudang.', { confirmText: 'Ajukan Transfer' })) return
    const payload = { ...form, product_id: Number(form.product_id), warehouse_id: Number(form.warehouse_id), target_warehouse_id: Number(form.target_warehouse_id), quantity: Number(form.quantity), transaction_type: 'transfer' }
    try {
      await api.post('/transfers', payload)
    } catch (err) {
      setError(errorMessage(err))
      return
    }
    setForm({ ...form, quantity: 1, notes: '' })
    await load()
  }

  async function exportPdf() {
    if (!await confirmAction('Export transfer stok ke PDF?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/transfers/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'transfer-stok.pdf')
  }

  async function processTransfer(row, action) {
    const label = action === 'approve' ? 'Setujui' : 'Tolak'
    if (!await confirmAction(`${label} transfer stok ini?`, { confirmText: label, danger: action === 'reject' })) return
    try {
      await api.post(`/transfers/${row.id}/${action}`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  function statusBadge(status) {
    const styles = {
      pending: 'bg-orange-50 text-warning',
      approved: 'bg-green-50 text-success',
      completed: 'bg-green-50 text-success',
      rejected: 'bg-red-50 text-danger'
    }
    const labels = {
      pending: 'Menunggu Approval',
      approved: 'Disetujui',
      completed: 'Selesai',
      rejected: 'Ditolak'
    }
    return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status] || 'bg-blue-soft text-navy'}`}>{labels[status] || status}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={exportPdf}><Download size={18} /> Export PDF</button>
      </div>
      <form onSubmit={submit} className="card grid gap-4 p-6 md:grid-cols-5">
        <label className="grid gap-2"><span className="label">Produk</span><select className="field" required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">Pilih</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="grid gap-2"><span className="label">Gudang Asal</span><select className="field" required value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}><option value="">Pilih</option>{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="grid gap-2"><span className="label">Gudang Tujuan</span><select className="field" required value={form.target_warehouse_id} onChange={(e) => setForm({ ...form, target_warehouse_id: e.target.value })}><option value="">Pilih</option>{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="grid gap-2"><span className="label">Jumlah</span><input className="field" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
        <div className="flex items-end"><button className="btn-primary w-full">Ajukan</button></div>
        {error && <p className="text-sm font-semibold text-danger md:col-span-5">{error}</p>}
      </form>
      <DataTable
        rows={rows}
        loading={loading}
        empty="Belum ada riwayat transfer."
        columns={[
          { key: 'product_name', label: 'Produk', render: (row) => row.product_name || row.product?.name || '-' },
          { key: 'from_warehouse_name', label: 'Gudang Asal', render: (row) => row.from_warehouse_name || row.warehouse?.name || '-' },
          { key: 'to_warehouse_name', label: 'Gudang Tujuan', render: (row) => row.to_warehouse_name || row.target_warehouse?.name || '-' },
          { key: 'quantity', label: 'Jumlah' },
          { key: 'status', label: 'Status', render: (row) => statusBadge(row.status || 'pending') },
          { key: 'created_at', label: 'Waktu', render: (row) => formatDate(row.created_at) },
          {
            key: 'actions',
            label: 'Approval',
            render: (row) => canApprove && row.status === 'pending' ? (
              <div className="flex gap-2">
                <button type="button" className="icon-button bg-green-50 text-success" onClick={() => processTransfer(row, 'approve')} aria-label="Setujui transfer"><Check size={17} /></button>
                <button type="button" className="icon-button bg-red-50 text-danger" onClick={() => processTransfer(row, 'reject')} aria-label="Tolak transfer"><X size={17} /></button>
              </div>
            ) : <span className="text-sm text-slate">-</span>
          }
        ]}
      />
    </div>
  )
}
