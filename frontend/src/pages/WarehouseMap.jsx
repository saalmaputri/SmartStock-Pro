import { useEffect, useState } from 'react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'

export default function WarehouseMap() {
  const [warehouses, setWarehouses] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/warehouses/map')
      .then(({ data }) => {
        const rows = data?.length ? data : []
        setWarehouses(rows)
        setSelected(rows[0] || null)
      })
      .catch(() => {
        setWarehouses([])
        setSelected(null)
      })
  }, [])

  const mapsQuery = encodeURIComponent(`${selected?.latitude || 0},${selected?.longitude || 0}`)
  const mapsUrl = `https://www.google.com/maps?q=${mapsQuery}`
  const embedUrl = `https://www.google.com/maps?q=${mapsQuery}&z=12&output=embed`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Peta Gudang"
        description="Lokasi gudang ditampilkan dengan Google Maps embed dan dapat dibuka langsung di Google Maps."
        action={selected ? <a className="btn-primary" href={mapsUrl} target="_blank" rel="noreferrer">Buka Google Maps</a> : null}
      />
      {!selected && <div className="card-static p-8 text-center text-slate">Data peta gudang belum tersedia dari backend.</div>}
      {selected && (
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card-static overflow-hidden">
          <iframe
            title={`Google Maps ${selected.name}`}
            src={embedUrl}
            className="h-[520px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="space-y-4">
          {warehouses.map((warehouse) => (
            <button
              key={warehouse.id}
              className={`w-full rounded-[1.5rem] p-4 text-left transition active:scale-[0.98] ${selected.id === warehouse.id ? 'bg-navy text-white shadow-card' : 'bg-white text-navy shadow-[0_18px_40px_rgba(0,43,91,0.05)] hover:bg-blue-soft'}`}
              onClick={() => setSelected(warehouse)}
            >
              <span className="badge border-line bg-blue-soft text-navy">{warehouse.code}</span>
              <h3 className={`mt-4 text-lg font-bold ${selected.id === warehouse.id ? 'text-white' : 'text-navy'}`}>{warehouse.city}</h3>
              <p className={selected.id === warehouse.id ? 'text-sm font-semibold text-white/80' : 'text-sm font-semibold text-slate'}>{warehouse.name}</p>
              <p className={selected.id === warehouse.id ? 'mt-2 text-sm text-white/70' : 'mt-2 text-sm text-slate'}>{warehouse.address}</p>
              <p className={selected.id === warehouse.id ? 'mt-4 text-xs font-bold text-white/60' : 'mt-4 text-xs font-bold text-slate'}>{warehouse.latitude}, {warehouse.longitude}</p>
            </button>
          ))}
        </div>
      </section>
      )}
    </div>
  )
}
