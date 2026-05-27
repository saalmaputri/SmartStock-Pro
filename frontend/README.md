# SmartStock Pro Frontend

Frontend React + Vite untuk mini project BNSP Web Developer SmartStock Pro.

## Install

```bash
npm install
```

## Menjalankan

```bash
npm run dev
```

Default API base URL:

```text
http://localhost:8000
```

Salin `.env.example` menjadi `.env` jika ingin mengubah URL backend.

## Halaman

- Login
- Dashboard
- Products
- Categories
- Warehouses
- Suppliers
- Transactions
- Transfers
- Reports
- Audit Logs
- Monitoring
- Error Logs
- Warehouse Map
- FAQ
- Change Log

## Endpoint

- `POST /auth/login`
- `GET /auth/me`
- `GET /dashboard/summary`
- `GET|POST|PUT|DELETE /products`
- `GET|POST|PUT|DELETE /categories`
- `GET|POST|PUT|DELETE /warehouses`
- `GET|POST|PUT|DELETE /suppliers`
- `GET|POST /transactions`
- `GET|POST /transfers`
- `GET /reports/stock/pdf`
- `GET /reports/stock/excel`
- `POST /products/import-csv`
- `GET /audit-logs`
- `GET /monitoring/resources`
- `GET /error-logs`
- `GET /warehouses/map`
