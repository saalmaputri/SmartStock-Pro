# API Documentation

Dokumentasi interaktif tersedia di:

```text
http://127.0.0.1:8000/docs
```

Endpoint utama:

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/auth/login` | Login dan mendapatkan JWT |
| GET | `/auth/me` | Data user aktif |
| GET/POST | `/products` | List dan tambah produk |
| PUT/DELETE | `/products/{id}` | Update dan hapus produk |
| POST | `/products/{id}/image` | Upload gambar produk |
| POST | `/products/import-csv` | Import produk CSV |
| GET/POST | `/categories` | CRUD kategori |
| GET/POST | `/warehouses` | CRUD gudang |
| GET/POST | `/suppliers` | CRUD supplier |
| GET | `/stocks` | Laporan stok saat ini |
| POST | `/transactions` | Transaksi masuk, keluar, transfer |
| GET | `/dashboard` | Statistik dashboard |
| GET | `/reports/stock.pdf` | Export laporan stok PDF |
| GET | `/audit-logs` | Audit aktivitas user |
| GET/POST | `/error-logs` | Error log |
| GET | `/monitoring` | Dummy CPU, memory, response time |
