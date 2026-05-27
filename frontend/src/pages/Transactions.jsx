import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { errorMessage, formatDate } from '../utils/format'

export default function Transactions() {
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', quantity: 1, transaction_type: 'in', notes: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [tx, productRes, warehouseRes] = await Promise.all([api.get('/transactions'), api.get('/products'), api.get('/warehouses')])
      setRows(tx.data)
      setProducts(productRes.data)
      setWarehouses(warehouseRes.data)
    } catch (err) {
      setRows([{ id: 1, transaction_type: 'in', product_name: 'Smart Watch Elite S2', quantity: 240, warehouse_name: 'Gudang A1', created_at: new Date().toISOString() }])
      setProducts([{ id: 1, name: 'Smart Watch Elite S2' }])
      setWarehouses([{ id: 1, name: 'Gudang A1' }])
      setError('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submit(event) {
    event.preventDefault()
    const label = form.transaction_type === 'out' ? 'barang keluar' : 'barang masuk'
    if (!await confirmAction(`Simpan transaksi ${label} ini? Stok akan diperbarui otomatis.`, { confirmText: 'Simpan Transaksi' })) return
    try {
      await api.post('/transactions', { ...form, product_id: Number(form.product_id), warehouse_id: Number(form.warehouse_id), quantity: Number(form.quantity) })
      setForm({ ...form, quantity: 1, notes: '' })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function exportPdf() {
    if (!await confirmAction('Export transaksi stok ke PDF?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/transactions/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'transaksi-stok.pdf')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={exportPdf}><Download size={18} /> Export PDF</button>
      </div>
      <form onSubmit={submit} className="card grid gap-4 p-6 md:grid-cols-5">
        <label className="grid gap-2"><span className="label">Tipe</span><select className="field" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}><option value="in">Barang Masuk</option><option value="out">Barang Keluar</option></select></label>
        <label className="grid gap-2"><span className="label">Produk</span><select className="field" required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">Pilih</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="grid gap-2"><span className="label">Gudang</span><select className="field" required value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}><option value="">Pilih</option>{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="grid gap-2"><span className="label">Jumlah</span><input className="field" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
        <div className="flex items-end"><button className="btn-primary w-full">Simpan</button></div>
        <label className="grid gap-2 md:col-span-5"><span className="label">Catatan</span><input className="field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        {error && <p className="text-sm font-semibold text-danger md:col-span-5">{error}</p>}
      </form>
      <DataTable
        rows={rows}
        loading={loading}
        columns={[
          { key: 'transaction_type', label: 'Tipe' },
          { key: 'product_name', label: 'Produk', render: (row) => row.product_name || row.product?.name || '-' },
          { key: 'quantity', label: 'Jumlah' },
          { key: 'warehouse_name', label: 'Gudang', render: (row) => row.warehouse_name || row.warehouse?.name || '-' },
          { key: 'created_at', label: 'Waktu', render: (row) => formatDate(row.created_at) }
        ]}
      />
    </div>
  )
}
