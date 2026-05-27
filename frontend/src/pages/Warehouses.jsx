import CrudPage from './CrudPage'

export default function Warehouses() {
  return (
    <CrudPage
      title="Manajemen Gudang"
      endpoint="/warehouses"
      fields={[{ name: 'name', label: 'Nama Gudang' }, { name: 'location', label: 'Lokasi' }]}
      columns={[{ key: 'name', label: 'Nama Gudang' }, { key: 'location', label: 'Lokasi' }]}
      dummyRows={[{ id: 1, name: 'Gudang A1', location: 'Jakarta' }, { id: 2, name: 'Gudang B4', location: 'Bekasi' }]}
    />
  )
}
