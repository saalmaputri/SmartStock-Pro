# Risk Analysis

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| SQL Injection | Data bocor atau rusak | Backend memakai SQLAlchemy ORM dan Pydantic validation, tidak menyusun query SQL mentah dari input user |
| XSS | Script berbahaya berjalan di browser | React melakukan escaping output secara default, input divalidasi, dan backend menambahkan security header `Content-Security-Policy` |
| CSRF | Request mutasi dikirim dari origin tidak sah | API memakai Bearer JWT di header, bukan cookie session; CORS dibatasi ke frontend lokal dan middleware menolak origin asing untuk POST/PUT/PATCH/DELETE |
| Password lemah | Akun mudah ditebak | Password disimpan dengan bcrypt/passlib dan validasi user baru mewajibkan minimal 8 karakter, huruf besar, huruf kecil, dan angka |
| Token dicuri atau sesi terlalu lama | Akses tidak sah | JWT memiliki expiration dan frontend memiliki session timeout LocalStorage |
| Penyalahgunaan role | Data diubah user yang tidak berwenang | Endpoint penting memakai guard role `require_roles` |
| Aktivitas tidak terlacak | Sulit audit saat insiden | Audit log mencatat login, CRUD, transaksi, transfer, import, dan export |
| SQLite rusak/terhapus | Data demo hilang | Backup file `smartstock_mvp.db` sebelum demo |
| File upload terlalu besar | Storage lokal penuh | MVP hanya untuk demo; gunakan file gambar kecil saat presentasi |
| Port bentrok | Aplikasi gagal jalan | Gunakan port alternatif untuk Uvicorn atau Vite |
