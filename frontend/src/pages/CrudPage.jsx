import { useEffect, useMemo, useState } from 'react'
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import { confirmAction } from '../utils/confirm'
import PageHeader from '../components/PageHeader'
import { errorMessage } from '../utils/format'

function Modal({ title, fields, form, setForm, onClose, onSubmit, saving }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/40 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-2xl border border-line bg-white p-6 shadow-modal">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy">{title}</h2>
          <button type="button" className="rounded-lg p-2 hover:bg-blue-soft" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="grid gap-4">
          {fields.map((field) => (
            <label key={field.name} className="grid gap-2">
              <span className="label">{field.label}</span>
              <input className="field" type={field.type || 'text'} required value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  )
}

export default function CrudPage({ title, endpoint, fields, columns, dummyRows = [] }) {
  const [rows, setRows] = useState(dummyRows)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const initialForm = Object.fromEntries(fields.map((field) => [field.name, '']))

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(endpoint)
      setRows(Array.isArray(data) ? data : dummyRows)
    } catch (err) {
      setRows(dummyRows)
      setError(dummyRows.length ? '' : errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [endpoint])

  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query])

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
    setModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ ...initialForm, ...row })
    setModal(true)
  }

  async function submit(event) {
    event.preventDefault()
    if (!await confirmAction(editing ? `Simpan perubahan ${title.toLowerCase()} ini?` : `Tambah ${title.toLowerCase()} baru ini?`)) return
    setSaving(true)
    try {
      if (editing) await api.put(`${endpoint}/${editing.id}`, form)
      else await api.post(endpoint, form)
      setModal(false)
      await load()
    } catch (err) {
      setRows((current) => editing ? current.map((item) => item.id === editing.id ? { ...item, ...form } : item) : [{ id: Date.now(), ...form }, ...current])
      setModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function remove(row) {
    if (!await confirmAction(`Hapus data ${title.toLowerCase()} ini? Data yang dihapus tidak bisa dikembalikan.`, { danger: true, confirmText: 'Hapus' })) return
    try {
      await api.delete(`${endpoint}/${row.id}`)
      await load()
    } catch {
      setRows((current) => current.filter((item) => item.id !== row.id))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={`Kelola data ${title.toLowerCase()} untuk kebutuhan operasional gudang.`}
        action={<button className="btn-primary" onClick={openCreate}><Plus size={19} /> Tambah</button>}
      />
      <section className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" size={20} />
          <input className="field h-14 w-full pl-12" placeholder={`Cari ${title.toLowerCase()}...`} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </section>
      <DataTable
        rows={filtered}
        columns={columns}
        loading={loading}
        error={error}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button className="rounded-xl bg-blue-soft p-2 text-navy hover:bg-blue-active" onClick={() => openEdit(row)}><Edit2 size={17} /></button>
            <button className="rounded-xl bg-red-50 p-2 text-danger hover:bg-red-100" onClick={() => remove(row)}><Trash2 size={17} /></button>
          </div>
        )}
      />
      {modal && <Modal title={editing ? `Edit ${title}` : `Tambah ${title}`} fields={fields} form={form} setForm={setForm} onClose={() => setModal(false)} onSubmit={submit} saving={saving} />}
    </div>
  )
}
