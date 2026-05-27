# Troubleshooting

## Backend tidak jalan

- Pastikan virtual environment aktif.
- Jalankan `pip install -r requirements.txt`.
- Pastikan port `8000` tidak dipakai aplikasi lain.

## Frontend tidak jalan

- Jalankan `npm install`.
- Pastikan Node.js sudah terpasang.
- Jika port `5173` bentrok, Vite akan menawarkan port lain.

## Login gagal

- Gunakan email akun demo di README.
- Password semua akun demo adalah `password123`.
- Hapus `backend/smartstock.db` lalu jalankan ulang backend jika seed data rusak.

## Upload gambar tidak tampil

- Pastikan backend berjalan di `http://127.0.0.1:8000`.
- Pastikan file tersimpan di folder `backend/uploads`.

## Import CSV gagal

- Pastikan header CSV: `sku,name,category_name,supplier_name,min_stock,price`.
- Simpan file CSV sebagai UTF-8.
