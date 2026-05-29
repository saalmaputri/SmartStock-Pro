# SmartStock Pro Backend

FastAPI backend untuk MVP SmartStock Pro.

## Install

```bash
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

Swagger tersedia di `http://127.0.0.1:8000/docs`.

## Database Production

Default lokal memakai SQLite `smartstock_mvp.db`. Untuk PostgreSQL/MySQL, set environment variable `DATABASE_URL` sebelum menjalankan backend.

```bash
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/smartstock
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/smartstock
```

## Akun Demo

- `admin@smartstock.com` / `admin123`
- `manager@smartstock.com` / `manager123`
- `staff@smartstock.com` / `staff123`
- `viewer@smartstock.com` / `viewer123`
