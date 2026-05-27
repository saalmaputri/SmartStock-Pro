import PageHeader from '../components/PageHeader'

const faqs = [
  ['Bagaimana cara login?', 'Gunakan akun demo sesuai role, lalu sistem menyimpan token sementara di LocalStorage.'],
  ['Apa fungsi Dashboard?', 'Dashboard menampilkan ringkasan produk, stok, gudang, nilai inventaris, grafik, dan alert stok minimum.'],
  ['Siapa yang boleh mengubah produk?', 'Admin dan Manajer Gudang memiliki akses penuh. Staf Gudang dan Viewer difokuskan untuk melihat data sesuai kebutuhan demo.'],
  ['Bagaimana transaksi barang masuk bekerja?', 'Transaksi IN akan menambah stock balance pada produk dan gudang yang dipilih.'],
  ['Bagaimana transaksi barang keluar bekerja?', 'Transaksi OUT akan mengurangi stok dan backend memvalidasi stok tidak boleh minus.'],
  ['Apa itu transfer stok?', 'Transfer memindahkan stok dari gudang asal ke gudang tujuan dengan validasi gudang tidak sama dan stok cukup.'],
  ['Bagaimana format CSV produk?', 'Gunakan header sku,name,category_name,supplier_name,min_stock,price.'],
  ['Bagaimana export PDF?', 'Halaman Reports memanggil endpoint laporan stok PDF dari backend.'],
  ['Apa fungsi audit log?', 'Audit log mencatat aktivitas login, CRUD, transaksi, transfer, import, dan export.'],
  ['Apakah bisa migrasi ke PostgreSQL?', 'Bisa. Backend memakai SQLAlchemy ORM sehingga engine database dapat diganti pada tahap berikutnya.']
]

export default function FAQ() {
  return (
    <div className="space-y-6">
      <PageHeader title="FAQ" description="Pertanyaan umum untuk membantu presentasi dan penggunaan SmartStock Pro." />
      <section className="grid gap-4 lg:grid-cols-2">
        {faqs.map(([question, answer], index) => (
          <article className="card p-5" key={question}>
            <span className="badge border-line bg-blue-soft text-navy">FAQ {index + 1}</span>
            <h3 className="mt-4 text-lg font-bold text-navy">{question}</h3>
            <p className="mt-2 text-sm leading-6 text-slate">{answer}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
