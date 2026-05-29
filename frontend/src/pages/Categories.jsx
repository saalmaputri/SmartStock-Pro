import CrudPage from './CrudPage'

export default function Categories() {
  return (
    <CrudPage
      title="Kategori"
      endpoint="/categories"
      fields={[{ name: 'name', label: 'Nama' }, { name: 'description', label: 'Deskripsi' }]}
      columns={[{ key: 'name', label: 'Nama' }, { key: 'description', label: 'Deskripsi' }]}
    />
  )
}
