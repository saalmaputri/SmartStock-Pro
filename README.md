# SmartStock Pro

SmartStock Pro adalah aplikasi web manajemen inventaris untuk produk, gudang, transaksi stok, transfer antar gudang, laporan, dan notifikasi stok.

Project ini dikembangkan sebagai mini project sertifikasi **BNSP Web Developer** dengan arsitektur fullstack modern menggunakan React dan FastAPI.

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

### Tools Pendukung
- Git Version Control
- ReportLab (Export PDF)
- Python CSV (Import Data)

---

## Struktur Folder

```text
smartstock-pro/
├── backend/
├── frontend/
├── docs/
├── README.md
└── .gitignore
```

---

# Kebutuhan Sistem

Pastikan perangkat sudah memiliki:

- Python 3.10+
- Node.js 18+
- NPM
- Git

Cek versi:

```powershell
python --version
node --version
npm --version
git --version
```

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

# Cara Menjalankan Project

## Terminal 1 - Backend

```powershell
cd backend

.\.venv\Scripts\Activate.ps1

uvicorn app.main:app --reload
```

## Terminal 2 - Frontend

```powershell
cd frontend

npm run dev
```

Kemudian buka:

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

# Dokumentasi

Folder:

```text
docs/
```

Berisi:

- Architecture Documentation
- Tools Analysis
- Scalability Analysis
- Migration Plan
- Cutover Plan
- Rollback Plan
- User Guide
- API Documentation
- Troubleshooting Guide
- FAQ

---

# API Documentation

FastAPI menyediakan dokumentasi otomatis:

```text
http://127.0.0.1:8000/docs
```

Endpoint utama:

```text
/auth/login
/products
/categories
/warehouses
/suppliers
/transactions
/transfers
/reports
/audit-logs
/error-logs
/monitoring
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

# Build Production

Frontend:

```powershell
cd frontend

npm run build
```

Preview:

```powershell
npm run preview
```

---

# Version Control

Project menggunakan Git.

Contoh workflow:

```bash
git add .

git commit -m "update feature"

git push origin main
```

---

# Catatan

Backend FastAPI harus berjalan sebelum frontend digunakan karena frontend mengambil data melalui REST API:

```text
http://127.0.0.1:8000
```

Project ini merupakan MVP sistem inventaris untuk kebutuhan mini project BNSP Web Developer.
