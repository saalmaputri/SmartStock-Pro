# SmartStock Pro

SmartStock Pro adalah aplikasi web manajemen inventaris untuk produk, gudang, transaksi stok, transfer antar gudang, laporan, dan notifikasi stok.

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- React Router DOM
- Axios
- Recharts

### Backend
- FastAPI
- SQLite
- SQLAlchemy ORM
- JWT Authentication
- bcrypt/passlib

# Kebutuhan Sistem

Pastikan perangkat sudah memiliki:

- Python 3.10+
- Node.js 18+
- NPM
- Git
---

# Instalasi Backend

Masuk ke folder backend:

```powershell
cd smartstock-pro\backend
```

Buat virtual environment:

```powershell
python -m venv .venv
```

Aktifkan environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependency:

```powershell
pip install -r requirements.txt
```

Jalankan server:

```powershell
uvicorn app.main:app --reload
```

Backend berjalan pada:

```text
http://127.0.0.1:8000
```

Swagger API:

```text
http://127.0.0.1:8000/docs
```

---

# Instalasi Frontend

Masuk folder frontend:

```powershell
cd smartstock-pro\frontend
```

Install package:

```powershell
npm install
```

Jalankan aplikasi:

```powershell
npm run dev
```

Frontend berjalan:

```text
http://127.0.0.1:5173
```

---

# Akun Demo

| Role | Email | Password |
|---|---|---|
| Admin | admin@smartstock.com | admin123 |
| Manajer Gudang | manager@smartstock.com | manager123 |
| Staf Gudang | staff@smartstock.com | staff123 |
| Viewer | viewer@smartstock.com | viewer123 |

---

# Hak Akses Role

## Admin
- Dashboard
- Manajemen User
- Produk
- Kategori
- Supplier
- Gudang
- Transaksi
- Transfer Stok
- Laporan
- Monitoring
- Audit Log
- Error Log

## Manajer Gudang
- Dashboard
- Produk
- Gudang
- Transaksi
- Transfer
- Laporan

## Staf Gudang
- Melihat produk
- Transaksi stok masuk
- Transaksi stok keluar
- Transfer stok

## Viewer
- Melihat dashboard
- Melihat laporan

---

# Fitur Utama

## Dashboard
- Total produk
- Total stok
- Total gudang
- Stok menipis
- Grafik transaksi masuk dan keluar
- Monitoring inventaris

## Produk
- CRUD produk
- Upload gambar produk
- Status stok
- Filter dan pencarian produk

## Gudang
- Manajemen multi gudang
- Gudang Jakarta
- Gudang Surabaya
- Gudang Bandung
- Gudang Medan
- Gudang Makassar

## Transaksi
- Barang masuk
- Barang keluar
- Update stok otomatis

## Transfer Gudang
- Transfer stok antar gudang
- Validasi stok tersedia
- Riwayat transfer

## Laporan
- Export PDF
- Export CSV
- Rekap inventaris

## Monitoring Sistem
- CPU Usage
- Memory Usage
- Response Time
- Status sistem

## Audit & Error Log
- Riwayat aktivitas user
- Pencatatan error aplikasi

---

# Database

Database menggunakan:

```text
SQLite
```

Lokasi file:

```text
backend/smartstock_mvp.db
```

Database otomatis dibuat ketika backend pertama kali dijalankan.

Untuk melihat database dapat menggunakan:

```text
DB Browser for SQLite
```

---

# Troubleshooting

## Frontend dependency error

Jalankan:

```powershell
cd frontend
npm install
```

---

## Backend dependency error

Jalankan:

```powershell
cd backend

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

---

## PowerShell tidak bisa menjalankan virtual environment

Gunakan:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Lalu aktifkan ulang:

```powershell
.\.venv\Scripts\Activate.ps1
```

---
## Dokumentasi API

Base URL:

```text
http://127.0.0.1:8000
```

Format request dan response menggunakan JSON, kecuali endpoint login yang memakai `application/x-www-form-urlencoded`.

Endpoint yang membutuhkan login harus mengirim header:

```http
Authorization: Bearer <access_token>
```

### Auth

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/auth/login` | Login dan mendapatkan JWT token |
| GET | `/auth/me` | Mengambil profil user yang sedang login |

Contoh login:

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=admin@smartstock.com&password=admin123
```

Response:

```json
{
  "access_token": "token_jwt",
  "token_type": "bearer"
}
```

### Dashboard

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/dashboard/summary` | Ringkasan dashboard, total stok, alert stok, grafik transaksi |
| GET | `/dashboard/pdf` | Export dashboard ke PDF |

### Produk

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/products` | Mengambil daftar produk beserta stok per gudang |
| POST | `/products` | Menambah produk baru dan stok pembukaan per gudang |
| PUT | `/products/{id}` | Mengubah data produk |
| DELETE | `/products/{id}` | Menghapus produk |
| POST | `/products/upload-image` | Upload gambar produk |
| POST | `/products/import-csv` | Import produk dari CSV |
| GET | `/products/pdf` | Export daftar produk ke PDF |

Contoh payload tambah produk:

```json
{
  "name": "Headphone Wireless",
  "sku": "",
  "category_id": 1,
  "description": "Produk elektronik",
  "unit": "Unit",
  "purchase_price": 250000,
  "selling_price": 350000,
  "min_stock": 15,
  "initial_stocks": {
    "1": 20,
    "2": 10,
    "3": 0,
    "4": 5,
    "5": 8
  }
}
```

### Kategori

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/categories` | Mengambil daftar kategori |
| POST | `/categories` | Menambah kategori |
| PUT | `/categories/{id}` | Mengubah kategori |
| DELETE | `/categories/{id}` | Menghapus kategori |

### Supplier

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/suppliers` | Mengambil daftar supplier |
| POST | `/suppliers` | Menambah supplier |
| PUT | `/suppliers/{id}` | Mengubah supplier |
| DELETE | `/suppliers/{id}` | Menghapus supplier |

### Gudang

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/warehouses` | Mengambil daftar gudang |
| POST | `/warehouses` | Menambah gudang |
| PUT | `/warehouses/{id}` | Mengubah gudang |
| DELETE | `/warehouses/{id}` | Menghapus gudang |
| GET | `/warehouses/map` | Mengambil data lokasi gudang |
| GET | `/warehouses/stock/pdf` | Export stok setiap gudang ke PDF |

### Stok dan Transaksi

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/stocks` | Mengambil stok produk per gudang |
| POST | `/transactions` | Membuat transaksi barang masuk/keluar |
| GET | `/transactions` | Mengambil riwayat transaksi stok |
| GET | `/transactions/pdf` | Export transaksi stok ke PDF |

Contoh payload transaksi barang masuk:

```json
{
  "product_id": 1,
  "warehouse_id": 1,
  "supplier_id": 1,
  "quantity": 25,
  "transaction_type": "in",
  "notes": "Barang masuk dari supplier"
}
```

Contoh payload transaksi barang keluar:

```json
{
  "product_id": 1,
  "warehouse_id": 1,
  "quantity": 5,
  "transaction_type": "out",
  "notes": "Barang keluar"
}
```

### Transfer Stok

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/transfers` | Mengambil riwayat transfer |
| POST | `/transfers` | Mengajukan transfer stok antar gudang |
| POST | `/transfers/{id}/approve` | Menyetujui transfer stok |
| POST | `/transfers/{id}/reject` | Menolak transfer stok |
| GET | `/transfers/pdf` | Export transfer stok ke PDF |

Contoh payload transfer:

```json
{
  "product_id": 1,
  "warehouse_id": 1,
  "target_warehouse_id": 2,
  "quantity": 10,
  "notes": "Transfer ke gudang tujuan"
}
```

### Laporan

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/reports/stock/pdf` | Export laporan stok ke PDF |
| GET | `/reports/stock/excel` | Export laporan stok ke CSV |
| POST | `/reports/stock/pdf/jobs` | Membuat background job laporan PDF |
| GET | `/jobs` | Mengambil daftar background job |
| GET | `/jobs/{id}` | Mengambil detail background job |

### Notifikasi dan Log

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/notifications` | Mengambil notifikasi stok/transfer |
| POST | `/notifications/read-all` | Menandai semua notifikasi sebagai dibaca |
| GET | `/audit-logs` | Mengambil audit log |
| GET | `/error-logs` | Mengambil error log |
| POST | `/error-logs` | Membuat error log |
| GET | `/monitoring/resources` | Mengambil status monitoring sederhana |
