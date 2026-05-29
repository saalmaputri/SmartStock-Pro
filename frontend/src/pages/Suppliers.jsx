import CrudPage from './CrudPage'

export default function Suppliers() {
  return (
    <CrudPage
      title="Supplier"
      endpoint="/suppliers"
      fields={[{ name: 'name', label: 'Nama Supplier' }, { name: 'phone', label: 'Telepon' }, { name: 'address', label: 'Alamat' }]}
      columns={[{ key: 'name', label: 'Nama Supplier' }, { key: 'phone', label: 'Telepon' }, { key: 'address', label: 'Alamat' }]}
    />
  )
}
