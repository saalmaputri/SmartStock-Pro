import { useEffect, useState } from 'react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'

const fallback = [
  { id: 1, name: 'Gudang Jakarta', code: 'JKT', city: 'Jakarta', address: 'Jl. Industri No. 1', latitude: -6.2, longitude: 106.8 },
  { id: 2, name: 'Gudang Surabaya', code: 'SBY', city: 'Surabaya', address: 'Jl. Logistik No. 2', latitude: -7.25, longitude: 112.75 },
  { id: 3, name: 'Gudang Bandung', code: 'BDG', city: 'Bandung', address: 'Jl. Gudang No. 3', latitude: -6.91, longitude: 107.61 },
  { id: 4, name: 'Gudang Medan', code: 'MDN', city: 'Medan', address: 'Jl. Sumatra No. 4', latitude: 3.59, longitude: 98.67 },
  { id: 5, name: 'Gudang Makassar', code: 'MKS', city: 'Makassar', address: 'Jl. Pelabuhan No. 5', latitude: -5.14, longitude: 119.41 }
]

export default function WarehouseMap() {
  const [warehouses, setWarehouses] = useState(fallback)
  const [selected, setSelected] = useState(fallback[0])

  useEffect(() => {
    api.get('/warehouses/map')
      .then(({ data }) => {
        const rows = data?.length ? data : fallback
        setWarehouses(rows)
        setSelected(rows[0])
      })
      .catch(() => {
        setWarehouses(fallback)
        setSelected(fallback[0])
      })
  }, [])

  const mapsQuery = encodeURIComponent(`${selected.latitude},${selected.longitude}`)
  const mapsUrl = `https://www.google.com/maps?q=${mapsQuery}`
  const embedUrl = `https://www.google.com/maps?q=${mapsQuery}&z=12&output=embed`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Peta Gudang"
        description="Lokasi gudang ditampilkan dengan Google Maps embed dan dapat dibuka langsung di Google Maps."
        action={<a className="btn-primary" href={mapsUrl} target="_blank" rel="noreferrer">Buka Google Maps</a>}
      />
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
    </div>
  )
}
