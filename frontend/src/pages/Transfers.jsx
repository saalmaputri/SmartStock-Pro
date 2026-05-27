import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { errorMessage, formatDate } from '../utils/format'

export default function Transfers() {
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', target_warehouse_id: '', quantity: 1, notes: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [transferRes, productRes, warehouseRes] = await Promise.all([
        api.get('/transfers').catch(() => api.get('/transactions')),
        api.get('/products'),
        api.get('/warehouses')
      ])
      setRows(transferRes.data.filter ? transferRes.data.filter((item) => item.transaction_type === 'transfer' || item.from_warehouse_name) : [])
      setProducts(productRes.data)
      setWarehouses(warehouseRes.data)
    } catch {
      setRows([{ id: 1, product_name: 'Papan Sirkuit v4.2', from_warehouse_name: 'Gudang A1', to_warehouse_name: 'Gudang B4', quantity: 18, created_at: new Date().toISOString() }])
      setProducts([{ id: 1, name: 'Papan Sirkuit v4.2' }])
      setWarehouses([{ id: 1, name: 'Gudang A1' }, { id: 2, name: 'Gudang B4' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submit(event) {
    event.preventDefault()
    if (!await confirmAction('Proses transfer stok antar gudang ini? Stok gudang asal dan tujuan akan diperbarui.', { confirmText: 'Proses Transfer' })) return
    const payload = { ...form, product_id: Number(form.product_id), warehouse_id: Number(form.warehouse_id), target_warehouse_id: Number(form.target_warehouse_id), quantity: Number(form.quantity), transaction_type: 'transfer' }
    try {
      await api.post('/transfers', payload)
    } catch {
      try {
        await api.post('/transactions', payload)
      } catch (err) {
        setError(errorMessage(err))
        return
      }
    }
    setForm({ ...form, quantity: 1, notes: '' })
    await load()
  }

  async function exportPdf() {
    if (!await confirmAction('Export transfer stok ke PDF?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/transfers/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'transfer-stok.pdf')
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
        <div className="flex items-end"><button className="btn-primary w-full">Transfer</button></div>
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
          { key: 'created_at', label: 'Waktu', render: (row) => formatDate(row.created_at) }
        ]}
      />
    </div>
  )
}
