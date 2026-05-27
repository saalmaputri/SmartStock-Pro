# Scalability

MVP memakai SQLite untuk kemudahan demo. Untuk produksi, arah pengembangan:

1. Migrasi database ke PostgreSQL.
2. Tambahkan Alembic untuk migration versioning.
3. Simpan gambar produk ke object storage.
4. Tambahkan pagination dan filter pada endpoint list.
5. Pisahkan service inventory, reporting, dan audit bila trafik bertambah.
6. Tambahkan background job untuk laporan besar.
