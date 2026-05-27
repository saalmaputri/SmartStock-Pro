# Architecture

SmartStock Pro menggunakan arsitektur client-server sederhana.

- Frontend React + Vite menyediakan UI dashboard, CRUD master data, transaksi stok, import CSV, export PDF, dan log.
- Backend FastAPI menyediakan REST API, autentikasi JWT, validasi role, dan proses bisnis inventaris.
- SQLite digunakan sebagai database demo lokal.
- SQLAlchemy ORM memisahkan model aplikasi dari engine database sehingga lebih mudah dimigrasikan ke PostgreSQL.

Alur utama:

1. User login melalui `/auth/login`.
2. Backend mengembalikan JWT.
3. Frontend menyimpan token di `localStorage`.
4. Setiap request API memakai header `Authorization: Bearer`.
5. Backend memvalidasi role sebelum menjalankan operasi tulis.
