import csv
import io
import random
import asyncio
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from . import auth, models, schemas
from .database import Base, SessionLocal, engine, get_db

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="SmartStock Pro API", version="1.2.0")
ALLOWED_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
JOB_QUEUE: dict[str, dict] = {}


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        if origin and origin not in ALLOWED_ORIGINS:
            return JSONResponse(status_code=403, content={"detail": "Origin tidak diizinkan"})
    try:
        response = await call_next(request)
    except Exception as exc:
        db = SessionLocal()
        try:
            db.add(models.ErrorLog(
                severity="critical",
                message=str(exc),
                module="exception-handler",
                path=str(request.url.path),
                method=request.method,
            ))
            db.commit()
        finally:
            db.close()
        return JSONResponse(status_code=500, content={"detail": "Terjadi error aplikasi. Admin dapat melihat detail di Error Logs."})
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'"
    return response


def audit(db: Session, user: models.User | None, action: str, module: str, record_id: str = "", request: Request | None = None):
    db.add(models.AuditLog(
        user_id=user.id if user else None,
        action=action,
        module=module,
        record_id=record_id,
        ip_address=request.client.host if request and request.client else "127.0.0.1",
    ))


def seed(db: Session):
    if db.query(models.Role).count():
        return
    roles = {
        "Admin": models.Role(name="Admin", description="Akses penuh"),
        "Manajer Gudang": models.Role(name="Manajer Gudang", description="Kelola operasional gudang"),
        "Staf Gudang": models.Role(name="Staf Gudang", description="Input transaksi gudang"),
        "Viewer": models.Role(name="Viewer", description="Akses baca"),
    }
    db.add_all(roles.values())
    db.flush()
    users = [
        ("Admin SmartStock", "admin@smartstock.com", "admin123", "Admin"),
        ("Manajer Gudang", "manager@smartstock.com", "manager123", "Manajer Gudang"),
        ("Staf Gudang", "staff@smartstock.com", "staff123", "Staf Gudang"),
        ("Viewer", "viewer@smartstock.com", "viewer123", "Viewer"),
    ]
    for name, email, password, role in users:
        db.add(models.User(name=name, email=email, password_hash=auth.get_password_hash(password), role_id=roles[role].id))

    categories = [models.Category(name=x, description=f"Kategori {x}") for x in ["Elektronik", "Logistik", "Peralatan", "ATK"]]
    suppliers = [
        models.Supplier(name="PT Demo Supplier", contact_person="Budi", phone="021-5550101", email="sales@demo.test", address="Jakarta"),
        models.Supplier(name="CV Sentosa", contact_person="Sinta", phone="021-5550202", email="info@sentosa.test", address="Bandung"),
        models.Supplier(name="Global Warehouse Supply", contact_person="Andi", phone="021-5550303", address="Surabaya"),
    ]
    warehouses = [
        models.Warehouse(name="Gudang Jakarta", code="JKT", city="Jakarta", address="Jl. Industri No. 1", latitude=-6.2, longitude=106.8),
        models.Warehouse(name="Gudang Surabaya", code="SBY", city="Surabaya", address="Jl. Logistik No. 2", latitude=-7.25, longitude=112.75),
        models.Warehouse(name="Gudang Bandung", code="BDG", city="Bandung", address="Jl. Gudang No. 3", latitude=-6.91, longitude=107.61),
        models.Warehouse(name="Gudang Medan", code="MDN", city="Medan", address="Jl. Sumatra No. 4", latitude=3.59, longitude=98.67),
        models.Warehouse(name="Gudang Makassar", code="MKS", city="Makassar", address="Jl. Pelabuhan No. 5", latitude=-5.14, longitude=119.41),
    ]
    db.add_all(categories + suppliers + warehouses)
    db.flush()
    products = []
    for idx, name in enumerate(["Smart Watch Elite S2", "Studio Pro Headphones", "Industrial Gear Hub", "Kabel LAN Cat6", "Barcode Scanner", "Rak Baja", "Sensor Tekanan G3", "Papan Sirkuit v4.2", "Pelumas Industri", "Kit Katup Hidrolik"], start=1):
        products.append(models.Product(
            name=name,
            sku=f"SKU-{idx:03d}",
            category_id=categories[idx % len(categories)].id,
            supplier_id=suppliers[idx % len(suppliers)].id,
            description=f"Produk demo {name}",
            unit="unit",
            purchase_price=50000 * idx,
            selling_price=65000 * idx,
            min_stock=10 + idx,
        ))
    db.add_all(products)
    db.flush()
    for product in products:
        for warehouse in warehouses[:2]:
            qty = random.choice([0, 5, 12, 45, 120, 240])
            db.add(models.StockBalance(product_id=product.id, warehouse_id=warehouse.id, quantity=qty))
    tx_in = models.TransactionType(name="Barang Masuk", code="IN")
    tx_out = models.TransactionType(name="Barang Keluar", code="OUT")
    db.add_all([tx_in, tx_out])
    db.add_all([
        models.AuditLog(action="seed", module="system", record_id="initial"),
        models.ErrorLog(severity="info", message="Seed data selesai", module="system", path="/startup", method="SYSTEM"),
    ])
    db.commit()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed(db)
    finally:
        db.close()


@app.post("/auth/login", response_model=schemas.Token)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form.username, form.password)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    user.last_login = datetime.utcnow()
    token = auth.create_access_token({"sub": user.email, "role": user.role_name})
    audit(db, user, "login", "auth", str(user.id), request)
    db.commit()
    return {"access_token": token}


@app.get("/auth/me")
def me(user: models.User = Depends(auth.get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role_name}


@app.get("/users")
def users(db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    return [{"id": row.id, "name": row.name, "email": row.email, "role": row.role_name, "is_active": row.is_active, "last_login": row.last_login} for row in db.query(models.User).order_by(models.User.id.desc()).all()]


@app.post("/users")
def create_user(payload: schemas.UserIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    item = models.User(name=payload.name, email=payload.email, role_id=payload.role_id, password_hash=auth.get_password_hash(payload.password), is_active=payload.is_active)
    db.add(item)
    db.flush()
    audit(db, user, "create", "users", str(item.id))
    db.commit()
    return {"id": item.id, "name": item.name, "email": item.email}


@app.put("/users/{item_id}")
def update_user(item_id: int, payload: schemas.UserIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    item = db.get(models.User, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    item.name = payload.name
    item.email = payload.email
    item.role_id = payload.role_id
    item.is_active = payload.is_active
    if payload.password:
        item.password_hash = auth.get_password_hash(payload.password)
    audit(db, user, "update", "users", str(item_id))
    db.commit()
    return {"id": item.id, "name": item.name, "email": item.email}


@app.delete("/users/{item_id}")
def delete_user(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    return crud_delete(models.User, item_id, db, user, "users")


def search_columns(model):
    return [getattr(model, name) for name in ("name", "sku", "code", "city", "email", "phone", "description") if hasattr(model, name)]


def list_items(
    model,
    db: Session,
    q: str | None = None,
    status: str | None = None,
    sort_by: str = "id",
    sort_dir: str = "desc",
    page: int | None = None,
    page_size: int = 10,
):
    query = db.query(model)
    if q:
        columns = search_columns(model)
        if columns:
            query = query.filter(or_(*[column.ilike(f"%{q}%") for column in columns]))
    if status in {"active", "inactive"} and hasattr(model, "is_active"):
        query = query.filter(model.is_active == (status == "active"))
    sort_column = getattr(model, sort_by, model.id)
    query = query.order_by(sort_column.desc() if sort_dir == "desc" else sort_column.asc())
    if page is None:
        return query.all()
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    total = query.count()
    return {
        "items": query.offset((page - 1) * page_size).limit(page_size).all(),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


def crud_create(model, payload, db: Session, user: models.User, module: str):
    item = model(**payload.model_dump())
    db.add(item)
    db.flush()
    audit(db, user, "create", module, str(item.id))
    db.commit()
    db.refresh(item)
    return item


def crud_update(model, item_id: int, payload, db: Session, user: models.User, module: str):
    item = db.get(model, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    audit(db, user, "update", module, str(item_id))
    db.commit()
    db.refresh(item)
    return item


def crud_delete(model, item_id: int, db: Session, user: models.User, module: str):
    item = db.get(model, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
    db.delete(item)
    audit(db, user, "delete", module, str(item_id))
    db.commit()
    return {"message": "Data dihapus"}


@app.get("/categories")
def categories(q: str | None = None, status: str | None = None, sort_by: str = "id", sort_dir: str = "desc", page: int | None = Query(default=None), page_size: int = 10, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return list_items(models.Category, db, q, status, sort_by, sort_dir, page, page_size)


@app.post("/categories")
def create_category(payload: schemas.CategoryIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return crud_create(models.Category, payload, db, user, "categories")


@app.put("/categories/{item_id}")
def update_category(item_id: int, payload: schemas.CategoryIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return crud_update(models.Category, item_id, payload, db, user, "categories")


@app.delete("/categories/{item_id}")
def delete_category(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    return crud_delete(models.Category, item_id, db, user, "categories")


@app.get("/suppliers")
def suppliers(q: str | None = None, status: str | None = None, sort_by: str = "id", sort_dir: str = "desc", page: int | None = Query(default=None), page_size: int = 10, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return list_items(models.Supplier, db, q, status, sort_by, sort_dir, page, page_size)


@app.post("/suppliers")
def create_supplier(payload: schemas.SupplierIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return crud_create(models.Supplier, payload, db, user, "suppliers")


@app.put("/suppliers/{item_id}")
def update_supplier(item_id: int, payload: schemas.SupplierIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return crud_update(models.Supplier, item_id, payload, db, user, "suppliers")


@app.delete("/suppliers/{item_id}")
def delete_supplier(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    return crud_delete(models.Supplier, item_id, db, user, "suppliers")


@app.get("/warehouses")
def warehouses(q: str | None = None, status: str | None = None, sort_by: str = "id", sort_dir: str = "desc", page: int | None = Query(default=None), page_size: int = 10, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return list_items(models.Warehouse, db, q, status, sort_by, sort_dir, page, page_size)


@app.get("/warehouses/map")
def warehouses_map(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return list_items(models.Warehouse, db)


@app.post("/warehouses")
def create_warehouse(payload: schemas.WarehouseIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return crud_create(models.Warehouse, payload, db, user, "warehouses")


@app.put("/warehouses/{item_id}")
def update_warehouse(item_id: int, payload: schemas.WarehouseIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return crud_update(models.Warehouse, item_id, payload, db, user, "warehouses")


@app.delete("/warehouses/{item_id}")
def delete_warehouse(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    return crud_delete(models.Warehouse, item_id, db, user, "warehouses")


def product_row(product: models.Product, db: Session):
    qty = db.query(func.coalesce(func.sum(models.StockBalance.quantity), 0)).filter(models.StockBalance.product_id == product.id).scalar() or 0
    return {
        "id": product.id, "name": product.name, "sku": product.sku,
        "category_id": product.category_id, "supplier_id": product.supplier_id,
        "category_name": product.category.name if product.category else "-",
        "supplier_name": product.supplier.name if product.supplier else "-",
        "description": product.description, "image_url": product.image_url,
        "unit": product.unit, "purchase_price": product.purchase_price,
        "selling_price": product.selling_price, "price": product.selling_price,
        "min_stock": product.min_stock, "quantity": int(qty), "is_active": product.is_active,
    }


@app.get("/products")
def products(
    q: str | None = None,
    category_id: int | None = None,
    supplier_id: int | None = None,
    status: str | None = None,
    sort_by: str = "id",
    sort_dir: str = "desc",
    page: int | None = Query(default=None),
    page_size: int = 10,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.Product)
    if q:
        query = query.outerjoin(models.Category).outerjoin(models.Supplier).filter(or_(
            models.Product.name.ilike(f"%{q}%"),
            models.Product.sku.ilike(f"%{q}%"),
            models.Product.description.ilike(f"%{q}%"),
            models.Category.name.ilike(f"%{q}%"),
            models.Supplier.name.ilike(f"%{q}%"),
        ))
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if supplier_id:
        query = query.filter(models.Product.supplier_id == supplier_id)
    if status in {"active", "inactive"}:
        query = query.filter(models.Product.is_active == (status == "active"))
    sort_column = getattr(models.Product, sort_by, models.Product.id)
    query = query.order_by(sort_column.desc() if sort_dir == "desc" else sort_column.asc())
    if page is None:
        return [product_row(product, db) for product in query.all()]
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [product_row(product, db) for product in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@app.post("/products")
def create_product(payload: schemas.ProductIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    data = payload.model_dump()
    if not data.get("sku"):
        data["sku"] = f"SKU-{db.query(models.Product).count() + 1:03d}"
    if not data.get("category_id"):
        category = db.query(models.Category).order_by(models.Category.id.asc()).first()
        data["category_id"] = category.id if category else None
    item = models.Product(**data)
    db.add(item)
    db.flush()
    audit(db, user, "create", "products", str(item.id))
    db.commit()
    db.refresh(item)
    return product_row(item, db)


@app.put("/products/{item_id}")
def update_product(item_id: int, payload: schemas.ProductIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return product_row(crud_update(models.Product, item_id, payload, db, user, "products"), db)


@app.delete("/products/{item_id}")
def delete_product(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    return crud_delete(models.Product, item_id, db, user, "products")


@app.post("/products/upload-image")
def upload_image(file: UploadFile = File(...), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    filename = f"{int(datetime.utcnow().timestamp())}-{file.filename}"
    target = UPLOAD_DIR / filename
    target.write_bytes(file.file.read())
    return {"image_url": f"/uploads/{filename}"}


def normalize_import_row(row: dict):
    sku = (row.get("sku") or "").strip()
    name = (row.get("name") or "").strip()
    if not sku or not name:
        return None
    return {
        "sku": sku,
        "name": name,
        "category_name": (row.get("category_name") or "Umum").strip(),
        "supplier_name": (row.get("supplier_name") or "Import").strip(),
        "min_stock": int(row.get("min_stock") or 5),
        "selling_price": float(row.get("price") or row.get("selling_price") or 0),
        "purchase_price": float(row.get("purchase_price") or 0),
        "unit": (row.get("unit") or "unit").strip(),
    }


@app.post("/products/import-csv")
def import_products(file: UploadFile = File(...), db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    content = file.file.read().decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(content)))
    with ThreadPoolExecutor(max_workers=4) as executor:
        normalized_rows = [row for row in executor.map(normalize_import_row, rows) if row]
    success = 0
    for row in normalized_rows:
        if db.query(models.Product).filter_by(sku=row["sku"]).first():
            continue
        category = db.query(models.Category).filter_by(name=row["category_name"]).first() or models.Category(name=row["category_name"])
        supplier = db.query(models.Supplier).filter_by(name=row["supplier_name"]).first() or models.Supplier(name=row["supplier_name"])
        db.add_all([category, supplier])
        db.flush()
        db.add(models.Product(
            name=row["name"], sku=row["sku"], category_id=category.id, supplier_id=supplier.id,
            min_stock=row["min_stock"], selling_price=row["selling_price"],
            purchase_price=row["purchase_price"], unit=row["unit"],
        ))
        success += 1
    db.add(models.ImportLog(user_id=user.id, filename=file.filename or "import.csv", total_rows=len(rows), success_rows=success, failed_rows=len(rows) - success, status="success"))
    audit(db, user, "import", "products", file.filename or "csv")
    db.commit()
    return {"imported": success, "total_rows": len(rows)}


def get_stock(db: Session, product_id: int, warehouse_id: int):
    stock = db.query(models.StockBalance).filter_by(product_id=product_id, warehouse_id=warehouse_id).first()
    if not stock:
        stock = models.StockBalance(product_id=product_id, warehouse_id=warehouse_id, quantity=0)
        db.add(stock)
        db.flush()
    return stock


def calculate_inventory_value(db: Session, method: str = "FIFO"):
    method = method.upper()
    rows = [row for row in db.query(models.StockBalance).all() if row.product]
    result = []
    total_value = 0
    for stock in rows:
        remaining = stock.quantity
        in_details = (
            db.query(models.TransactionDetail)
            .join(models.Transaction)
            .join(models.TransactionType, models.TransactionType.id == models.Transaction.type_id)
            .filter(models.TransactionDetail.product_id == stock.product_id, models.Transaction.warehouse_id == stock.warehouse_id, models.TransactionType.code == "IN")
            .order_by(models.Transaction.created_at.asc() if method == "FIFO" else models.Transaction.created_at.desc())
            .all()
        )
        value = 0
        for detail in in_details:
            if remaining <= 0:
                break
            used = min(remaining, detail.quantity)
            value += used * (detail.unit_price or stock.product.purchase_price)
            remaining -= used
        if remaining > 0:
            value += remaining * stock.product.purchase_price
        total_value += value
        result.append({"product_id": stock.product_id, "warehouse_id": stock.warehouse_id, "quantity": stock.quantity, "method": method, "value": value})
    return {"method": method, "total_value": total_value, "items": result}


@app.get("/inventory/valuation")
def inventory_valuation(method: str = "FIFO", db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    if method.upper() not in {"FIFO", "LIFO"}:
        raise HTTPException(status_code=400, detail="Method harus FIFO atau LIFO")
    return calculate_inventory_value(db, method)


@app.get("/stocks")
def stocks(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return [{
        "id": row.id, "product_id": row.product_id, "warehouse_id": row.warehouse_id,
        "sku": row.product.sku, "product_name": row.product.name,
        "warehouse_name": row.warehouse.name, "quantity": row.quantity, "min_stock": row.product.min_stock
    } for row in db.query(models.StockBalance).all()]


@app.post("/transactions")
def create_transaction(payload: schemas.TransactionIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang", "Staf Gudang"))):
    tx_code = "IN" if payload.transaction_type in {"in", "IN"} else "OUT"
    tx_type = db.query(models.TransactionType).filter_by(code=tx_code).first()
    stock = get_stock(db, payload.product_id, payload.warehouse_id)
    if tx_code == "IN":
        stock.quantity += payload.quantity
    else:
        # MVP memakai stock balance tunggal; valuasi FIFO/LIFO disediakan di /inventory/valuation.
        if stock.quantity < payload.quantity:
            raise HTTPException(status_code=400, detail="Stok tidak mencukupi")
        stock.quantity -= payload.quantity
    tx = models.Transaction(type_id=tx_type.id, warehouse_id=payload.warehouse_id, user_id=user.id, notes=payload.notes, reference_no=f"TRX-{int(datetime.utcnow().timestamp())}")
    db.add(tx)
    db.flush()
    db.add(models.TransactionDetail(transaction_id=tx.id, product_id=payload.product_id, quantity=payload.quantity, unit_price=payload.unit_price, subtotal=payload.quantity * payload.unit_price, notes=payload.notes))
    audit(db, user, "transaction", "transactions", str(tx.id))
    db.commit()
    return {"id": tx.id, "transaction_type": tx_code.lower(), "product_id": payload.product_id, "warehouse_id": payload.warehouse_id, "quantity": payload.quantity, "notes": payload.notes, "created_at": tx.created_at}


@app.get("/transactions")
def transactions(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    rows = db.query(models.Transaction).order_by(models.Transaction.id.desc()).limit(100).all()
    result = []
    for tx in rows:
        detail = tx.details[0] if tx.details else None
        result.append({
            "id": tx.id, "transaction_type": tx.type.code.lower(), "product_name": detail.product.name if detail else "-",
            "quantity": detail.quantity if detail else 0, "warehouse_name": tx.warehouse.name,
            "created_at": tx.created_at, "notes": tx.notes
        })
    return result


@app.post("/transfers")
async def create_transfer(payload: schemas.TransferIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang", "Staf Gudang"))):
    source_id = payload.source_warehouse_id or payload.warehouse_id
    destination_id = payload.destination_warehouse_id or payload.target_warehouse_id
    if source_id == destination_id:
        raise HTTPException(status_code=400, detail="Gudang asal dan tujuan tidak boleh sama")
    source = get_stock(db, payload.product_id, source_id)
    if source.quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Stok gudang asal tidak mencukupi")
    destination = get_stock(db, payload.product_id, destination_id)

    async def decrease_source():
        source.quantity -= payload.quantity

    async def increase_destination():
        destination.quantity += payload.quantity

    await asyncio.gather(decrease_source(), increase_destination())
    transfer = models.Transfer(product_id=payload.product_id, source_warehouse_id=source_id, destination_warehouse_id=destination_id, user_id=user.id, quantity=payload.quantity, notes=payload.notes)
    db.add(transfer)
    audit(db, user, "transfer", "transfers", str(payload.product_id))
    db.commit()
    return {"id": transfer.id, "status": transfer.status}


@app.get("/transfers")
def transfers(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return [{
        "id": row.id, "product_name": row.product.name, "from_warehouse_name": row.source_warehouse.name,
        "to_warehouse_name": row.destination_warehouse.name, "quantity": row.quantity, "status": row.status,
        "created_at": row.created_at
    } for row in db.query(models.Transfer).order_by(models.Transfer.id.desc()).limit(100).all()]


@app.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    stock_rows = [row for row in db.query(models.StockBalance).all() if row.product and row.warehouse]
    total_stock = sum(row.quantity for row in stock_rows)
    low_stock = [row for row in stock_rows if row.quantity <= row.product.min_stock]
    inventory_value = sum(row.quantity * row.product.purchase_price for row in stock_rows)
    tx_data = db.query(models.TransactionType.code, func.coalesce(func.sum(models.TransactionDetail.quantity), 0)).join(models.Transaction, models.Transaction.type_id == models.TransactionType.id).join(models.TransactionDetail, models.TransactionDetail.transaction_id == models.Transaction.id).group_by(models.TransactionType.code).all()
    movement = [{"label": code, "in": qty if code == "IN" else 0, "out": qty if code == "OUT" else 0, "type": code.lower(), "quantity": qty} for code, qty in tx_data]
    return {
        "total_products": db.query(models.Product).count(),
        "total_stock": total_stock,
        "low_stock_count": len(low_stock),
        "total_warehouses": db.query(models.Warehouse).count(),
        "inventory_value": inventory_value,
        "movement_chart": movement or [{"label": "IN", "in": 120, "out": 0}, {"label": "OUT", "in": 0, "out": 45}],
        "low_stock_alerts": [{"product_name": row.product.name, "warehouse": row.warehouse.name, "quantity": row.quantity, "min_stock": row.product.min_stock} for row in low_stock[:8]],
        "latest": [{"id": f"TRX-{tx.id}", "product": tx.details[0].product.name if tx.details else "-", "movement": f"{tx.type.code} {tx.details[0].quantity if tx.details else 0}", "warehouse": tx.warehouse.name, "time": tx.created_at.strftime("%d %b, %H:%M")} for tx in db.query(models.Transaction).order_by(models.Transaction.id.desc()).limit(5).all()],
    }


@app.get("/dashboard/pdf")
def dashboard_pdf(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    summary = dashboard_summary(db, user)
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    navy = colors.HexColor("#001736")
    blue_soft = colors.HexColor("#f2f4f6")
    blue_active = colors.HexColor("#beddfe")
    danger = colors.HexColor("#ba1a1a")
    success = colors.HexColor("#079455")
    slate = colors.HexColor("#43474f")

    pdf.setTitle("Laporan Dashboard Inventaris")
    pdf.setFillColor(navy)
    pdf.roundRect(36, height - 92, width - 72, 56, 14, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(58, height - 60, "SmartStock Pro")
    pdf.setFont("Helvetica", 9)
    pdf.drawRightString(width - 58, height - 58, f"Dicetak: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    pdf.drawRightString(width - 58, height - 74, "Laporan Dashboard Inventaris")

    y = height - 128
    cards = [
        ("Total Produk", summary["total_products"], navy),
        ("Total Stok", summary["total_stock"], navy),
        ("Stok Menipis", summary["low_stock_count"], danger),
        ("Total Gudang", summary["total_warehouses"], navy),
        ("Nilai Inventaris", f"Rp {int(summary['inventory_value']):,}".replace(",", "."), success),
    ]
    card_w = (width - 96) / 5
    for index, (label, value, color) in enumerate(cards):
        x = 36 + index * (card_w + 6)
        pdf.setFillColor(blue_soft)
        pdf.roundRect(x, y - 46, card_w, 46, 10, fill=1, stroke=0)
        pdf.setFillColor(slate)
        pdf.setFont("Helvetica", 7)
        pdf.drawString(x + 8, y - 16, label[:16])
        pdf.setFillColor(color)
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(x + 8, y - 34, str(value)[:18])

    y -= 88
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(36, y, "Grafik Barang Masuk dan Keluar")
    y -= 26
    chart = summary["movement_chart"]
    max_qty = max([max(int(row.get("in", 0) or 0), int(row.get("out", 0) or 0)) for row in chart] or [1])
    for row in chart[:8]:
        label = str(row.get("label") or row.get("type") or "-")[:12]
        in_qty = int(row.get("in", 0) or 0)
        out_qty = int(row.get("out", 0) or 0)
        in_w = int((in_qty / max_qty) * 190) if max_qty else 0
        out_w = int((out_qty / max_qty) * 190) if max_qty else 0
        pdf.setFillColor(slate)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(36, y, label)
        pdf.setFillColor(blue_soft)
        pdf.roundRect(130, y - 4, 190, 7, 4, fill=1, stroke=0)
        pdf.roundRect(360, y - 4, 190, 7, 4, fill=1, stroke=0)
        pdf.setFillColor(blue_active)
        pdf.roundRect(130, y - 4, in_w, 7, 4, fill=1, stroke=0)
        pdf.setFillColor(danger)
        pdf.roundRect(360, y - 4, out_w, 7, 4, fill=1, stroke=0)
        pdf.setFillColor(slate)
        pdf.drawRightString(350, y - 2, f"Masuk {in_qty}")
        pdf.drawRightString(556, y - 2, f"Keluar {out_qty}")
        y -= 20

    y -= 16
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(36, y, "Alert Stok Minimum")
    y -= 24
    for item in summary["low_stock_alerts"][:8]:
        if y < 50:
            pdf.showPage()
            y = height - 50
        pdf.setFillColor(colors.HexColor("#ffdad6"))
        pdf.roundRect(36, y - 5, width - 72, 18, 5, fill=1, stroke=0)
        pdf.setFillColor(navy)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(48, y, str(item.get("product_name", "-"))[:28])
        pdf.drawString(250, y, str(item.get("warehouse", "-"))[:20])
        pdf.setFillColor(danger)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(438, y, f"Sisa {item.get('quantity', 0)} / Min {item.get('min_stock', '-')}")
        y -= 20

    pdf.setFillColor(slate)
    pdf.setFont("Helvetica", 7)
    pdf.drawCentredString(width / 2, 24, "SmartStock Pro - Laporan Dashboard Inventaris")
    pdf.save()
    buffer.seek(0)
    audit(db, user, "export", "dashboard", "pdf")
    db.commit()
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=dashboard-inventaris.pdf"})


@app.get("/dashboard")
def dashboard_alias(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return dashboard_summary(db, user)


@app.get("/reports/stock/pdf")
@app.get("/reports/stock.pdf")
def stock_pdf(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    pdf.setTitle("Laporan Stok SmartStock Pro")

    stock_rows = [row for row in db.query(models.StockBalance).all() if row.product and row.warehouse]
    total_products = db.query(models.Product).count()
    total_stock = sum(row.quantity for row in stock_rows)
    low_stock = sum(1 for row in stock_rows if row.quantity <= row.product.min_stock)
    inventory_value = sum(row.quantity * row.product.purchase_price for row in stock_rows)

    navy = colors.HexColor("#001736")
    blue_soft = colors.HexColor("#f2f4f6")
    blue_active = colors.HexColor("#beddfe")
    danger = colors.HexColor("#ba1a1a")
    slate = colors.HexColor("#43474f")

    pdf.setFillColor(navy)
    pdf.roundRect(36, height - 92, width - 72, 56, 14, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(58, height - 60, "SmartStock Pro")
    pdf.setFont("Helvetica", 9)
    pdf.drawRightString(width - 58, height - 58, f"Dicetak: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    pdf.drawRightString(width - 58, height - 74, "Laporan Stok Inventaris")

    y = height - 128
    cards = [
        ("Total Produk", total_products, navy),
        ("Total Stok", total_stock, navy),
        ("Stok Menipis", low_stock, danger),
        ("Nilai Inventaris", f"Rp {int(inventory_value):,}".replace(",", "."), navy),
    ]
    card_w = (width - 90) / 4
    for index, (label, value, color) in enumerate(cards):
        x = 36 + index * (card_w + 6)
        pdf.setFillColor(blue_soft)
        pdf.roundRect(x, y - 46, card_w, 46, 10, fill=1, stroke=0)
        pdf.setFillColor(slate)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(x + 10, y - 16, label)
        pdf.setFillColor(color)
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(x + 10, y - 34, str(value))

    y -= 82
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(36, y, "Visual Ringkasan Stok")
    y -= 18
    top_rows = sorted(stock_rows, key=lambda row: row.quantity, reverse=True)[:5]
    max_qty = max([row.quantity for row in top_rows] or [1])
    for row in top_rows:
        bar_w = int((row.quantity / max_qty) * 260)
        pdf.setFillColor(blue_soft)
        pdf.roundRect(160, y - 5, 260, 8, 4, fill=1, stroke=0)
        pdf.setFillColor(blue_active if row.quantity > row.product.min_stock else colors.HexColor("#ffdad6"))
        pdf.roundRect(160, y - 5, bar_w, 8, 4, fill=1, stroke=0)
        pdf.setFillColor(slate)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(36, y - 3, row.product.name[:20])
        pdf.drawRightString(455, y - 3, str(row.quantity))
        y -= 16

    y -= 16
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(36, y, "Tabel Stok Gudang")
    y -= 24

    def draw_table_header(current_y):
        pdf.setFillColor(navy)
        pdf.roundRect(36, current_y - 16, width - 72, 20, 7, fill=1, stroke=0)
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 8)
        for label, x in [("SKU", 48), ("Produk", 112), ("Gudang", 282), ("Stok", 430), ("Status", 480)]:
            pdf.drawString(x, current_y - 10, label)

    draw_table_header(y)
    y -= 28
    pdf.setFont("Helvetica", 8)
    for index, row in enumerate(stock_rows):
        if y < 50:
            pdf.showPage()
            y = height - 50
            draw_table_header(y)
            y -= 28
            pdf.setFont("Helvetica", 8)
        if index % 2 == 0:
            pdf.setFillColor(colors.HexColor("#fafafa"))
            pdf.roundRect(36, y - 5, width - 72, 18, 5, fill=1, stroke=0)
        status = "Menipis" if row.quantity <= row.product.min_stock else "Aman"
        status_color = danger if status == "Menipis" else colors.HexColor("#079455")
        pdf.setFillColor(navy)
        pdf.drawString(48, y, row.product.sku[:10])
        pdf.drawString(112, y, row.product.name[:26])
        pdf.drawString(282, y, row.warehouse.name[:20])
        pdf.drawString(430, y, str(row.quantity))
        pdf.setFillColor(status_color)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(480, y, status)
        pdf.setFont("Helvetica", 8)
        y -= 20

    pdf.setFillColor(slate)
    pdf.setFont("Helvetica", 7)
    pdf.drawCentredString(width / 2, 24, "SmartStock Pro - Laporan Inventaris")
    pdf.save()
    buffer.seek(0)
    db.add(models.Report(user_id=user.id, report_type="stock_pdf", file_url="laporan-stok.pdf"))
    audit(db, user, "export", "reports", "stock_pdf")
    db.commit()
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=laporan-stok.pdf"})


def run_report_job(job_id: str, user_id: int | None):
    JOB_QUEUE[job_id]["status"] = "processing"
    JOB_QUEUE[job_id]["started_at"] = datetime.utcnow().isoformat()
    db = SessionLocal()
    try:
        time.sleep(1)
        report = models.Report(user_id=user_id, report_type="stock_pdf_background", file_url="/reports/stock/pdf")
        db.add(report)
        db.add(models.AuditLog(user_id=user_id, action="background_report", module="reports", record_id=job_id, ip_address="127.0.0.1"))
        db.commit()
        JOB_QUEUE[job_id].update({
            "status": "completed",
            "file_url": "/reports/stock/pdf",
            "finished_at": datetime.utcnow().isoformat(),
        })
    except Exception as exc:
        db.rollback()
        db.add(models.ErrorLog(severity="critical", message=str(exc), module="background-job", path="/reports/stock/pdf/jobs", method="POST"))
        db.commit()
        JOB_QUEUE[job_id].update({"status": "failed", "error": str(exc), "finished_at": datetime.utcnow().isoformat()})
    finally:
        db.close()


@app.post("/reports/stock/pdf/jobs")
def create_report_job(background_tasks: BackgroundTasks, user: models.User = Depends(auth.get_current_user)):
    job_id = str(uuid.uuid4())
    JOB_QUEUE[job_id] = {
        "id": job_id,
        "type": "stock_pdf",
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "file_url": None,
    }
    background_tasks.add_task(run_report_job, job_id, user.id)
    return JOB_QUEUE[job_id]


@app.get("/jobs")
def jobs(user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return sorted(JOB_QUEUE.values(), key=lambda item: item["created_at"], reverse=True)


@app.get("/jobs/{job_id}")
def job_detail(job_id: str, user: models.User = Depends(auth.get_current_user)):
    job = JOB_QUEUE.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan")
    return job


@app.post("/warehouses/sync/jobs")
def create_warehouse_sync_job(background_tasks: BackgroundTasks, user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    job_id = str(uuid.uuid4())
    JOB_QUEUE[job_id] = {
        "id": job_id,
        "type": "warehouse_sync",
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "note": "Simulasi job queue sinkronisasi otomatis antar gudang untuk MVP lokal.",
    }

    def sync_job():
        JOB_QUEUE[job_id]["status"] = "processing"
        time.sleep(1)
        JOB_QUEUE[job_id]["status"] = "completed"
        JOB_QUEUE[job_id]["finished_at"] = datetime.utcnow().isoformat()

    background_tasks.add_task(sync_job)
    return JOB_QUEUE[job_id]


@app.get("/reports/stock/excel")
def stock_excel(user: models.User = Depends(auth.get_current_user)):
    content = "sku,product,warehouse,quantity\n"
    return StreamingResponse(io.BytesIO(content.encode()), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=laporan-stok.csv"})


@app.get("/transactions/pdf")
def transactions_pdf(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    rows = db.query(models.Transaction).order_by(models.Transaction.id.desc()).limit(200).all()
    audit(db, user, "export", "transactions", "pdf")
    db.commit()
    return log_pdf(
        "Laporan Transaksi Stok",
        ["Ref", "Tipe", "Produk", "Gudang", "Jumlah", "Waktu"],
        [[
            row.reference_no or f"TRX-{row.id}",
            row.type.code if row.type else "-",
            row.details[0].product.name if row.details and row.details[0].product else "-",
            row.warehouse.name if row.warehouse else "-",
            row.details[0].quantity if row.details else 0,
            row.created_at.strftime("%Y-%m-%d %H:%M"),
        ] for row in rows],
        "transaksi-stok.pdf",
    )


@app.get("/transfers/pdf")
def transfers_pdf(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    rows = db.query(models.Transfer).order_by(models.Transfer.id.desc()).limit(200).all()
    audit(db, user, "export", "transfers", "pdf")
    db.commit()
    return log_pdf(
        "Laporan Transfer Stok",
        ["Produk", "Gudang Asal", "Gudang Tujuan", "Jumlah", "Status", "Waktu"],
        [[
            row.product.name if row.product else "-",
            row.source_warehouse.name if row.source_warehouse else "-",
            row.destination_warehouse.name if row.destination_warehouse else "-",
            row.quantity,
            row.status,
            row.created_at.strftime("%Y-%m-%d %H:%M"),
        ] for row in rows],
        "transfer-stok.pdf",
    )


@app.get("/products/pdf")
def products_pdf(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    products = db.query(models.Product).order_by(models.Product.name.asc()).all()
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    navy = colors.HexColor("#001736")
    blue_soft = colors.HexColor("#f2f4f6")
    blue_active = colors.HexColor("#beddfe")
    danger = colors.HexColor("#ba1a1a")
    warning = colors.HexColor("#b54708")
    success = colors.HexColor("#079455")
    slate = colors.HexColor("#43474f")

    pdf.setTitle("Laporan Manajemen Produk")
    pdf.setFillColor(navy)
    pdf.roundRect(36, height - 92, width - 72, 56, 14, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(58, height - 60, "SmartStock Pro")
    pdf.setFont("Helvetica", 9)
    pdf.drawRightString(width - 58, height - 58, f"Dicetak: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    pdf.drawRightString(width - 58, height - 74, "Laporan Manajemen Produk")

    product_rows = []
    for product in products:
        qty = db.query(func.coalesce(func.sum(models.StockBalance.quantity), 0)).filter(models.StockBalance.product_id == product.id).scalar() or 0
        status = "Habis" if qty <= 0 else "Menipis" if qty <= product.min_stock else "Aman"
        product_rows.append((product, int(qty), status))

    total_products = len(product_rows)
    total_stock = sum(qty for _, qty, _ in product_rows)
    low_stock = sum(1 for _, _, status in product_rows if status == "Menipis")
    out_stock = sum(1 for _, _, status in product_rows if status == "Habis")

    y = height - 128
    cards = [
        ("Total Produk", total_products, navy),
        ("Total Stok", total_stock, navy),
        ("Stok Menipis", low_stock, warning),
        ("Stok Habis", out_stock, danger),
    ]
    card_w = (width - 90) / 4
    for index, (label, value, color) in enumerate(cards):
        x = 36 + index * (card_w + 6)
        pdf.setFillColor(blue_soft)
        pdf.roundRect(x, y - 46, card_w, 46, 10, fill=1, stroke=0)
        pdf.setFillColor(slate)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(x + 10, y - 16, label)
        pdf.setFillColor(color)
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(x + 10, y - 34, str(value))

    y -= 82
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(36, y, "Grafik Stok Produk Teratas")
    y -= 18
    top_rows = sorted(product_rows, key=lambda row: row[1], reverse=True)[:5]
    max_qty = max([qty for _, qty, _ in top_rows] or [1])
    for product, qty, status in top_rows:
        bar_w = int((qty / max_qty) * 260)
        pdf.setFillColor(blue_soft)
        pdf.roundRect(160, y - 5, 260, 8, 4, fill=1, stroke=0)
        pdf.setFillColor(danger if status == "Habis" else warning if status == "Menipis" else blue_active)
        pdf.roundRect(160, y - 5, bar_w, 8, 4, fill=1, stroke=0)
        pdf.setFillColor(slate)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(36, y - 3, product.name[:20])
        pdf.drawRightString(455, y - 3, str(qty))
        y -= 16

    y -= 16
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(36, y, "Tabel Produk")
    y -= 24

    def draw_product_header(current_y):
        pdf.setFillColor(navy)
        pdf.roundRect(36, current_y - 16, width - 72, 20, 7, fill=1, stroke=0)
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 8)
        for label, x in [("SKU", 48), ("Produk", 112), ("Kategori", 278), ("Stok", 394), ("Status", 442), ("Harga", 502)]:
            pdf.drawString(x, current_y - 10, label)

    draw_product_header(y)
    y -= 28
    for index, (product, qty, status) in enumerate(product_rows):
        if y < 50:
            pdf.showPage()
            y = height - 50
            draw_product_header(y)
            y -= 28
        if index % 2 == 0:
            pdf.setFillColor(blue_soft)
            pdf.roundRect(36, y - 5, width - 72, 18, 5, fill=1, stroke=0)
        status_color = danger if status == "Habis" else warning if status == "Menipis" else success
        pdf.setFillColor(navy)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(48, y, product.sku[:10])
        pdf.drawString(112, y, product.name[:24])
        pdf.drawString(278, y, (product.category.name if product.category else "-")[:16])
        pdf.drawString(394, y, str(qty))
        pdf.setFillColor(status_color)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(442, y, status)
        pdf.setFillColor(navy)
        pdf.setFont("Helvetica", 8)
        pdf.drawRightString(558, y, f"Rp {int(product.selling_price):,}".replace(",", "."))
        y -= 20

    pdf.setFillColor(slate)
    pdf.setFont("Helvetica", 7)
    pdf.drawCentredString(width / 2, 24, "SmartStock Pro - Laporan Manajemen Produk")
    pdf.save()
    buffer.seek(0)
    audit(db, user, "export", "products", "pdf")
    db.commit()
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=manajemen-produk.pdf"})


def log_pdf(title: str, headers: list[str], rows: list[list[str]], filename: str):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    navy = colors.HexColor("#001736")
    blue_soft = colors.HexColor("#f2f4f6")
    slate = colors.HexColor("#43474f")

    pdf.setTitle(title)
    pdf.setFillColor(navy)
    pdf.roundRect(36, height - 92, width - 72, 56, 14, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 17)
    pdf.drawString(58, height - 60, "SmartStock Pro")
    pdf.setFont("Helvetica", 9)
    pdf.drawRightString(width - 58, height - 58, f"Dicetak: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    pdf.drawRightString(width - 58, height - 74, title)

    y = height - 126
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(36, y, title)
    y -= 24

    def draw_header(current_y):
        pdf.setFillColor(navy)
        pdf.roundRect(36, current_y - 16, width - 72, 20, 7, fill=1, stroke=0)
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 7)
        x = 48
        col_w = (width - 96) / len(headers)
        for label in headers:
            pdf.drawString(x, current_y - 10, label[:18])
            x += col_w

    draw_header(y)
    y -= 28
    col_w = (width - 96) / len(headers)
    for index, row in enumerate(rows):
        if y < 50:
            pdf.showPage()
            y = height - 50
            draw_header(y)
            y -= 28
        if index % 2 == 0:
            pdf.setFillColor(blue_soft)
            pdf.roundRect(36, y - 5, width - 72, 18, 5, fill=1, stroke=0)
        pdf.setFillColor(slate)
        pdf.setFont("Helvetica", 7)
        x = 48
        for value in row:
            pdf.drawString(x, y, str(value or "-")[:22])
            x += col_w
        y -= 20

    pdf.setFillColor(slate)
    pdf.setFont("Helvetica", 7)
    pdf.drawCentredString(width / 2, 24, "SmartStock Pro - Laporan Log Sistem")
    pdf.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


@app.get("/audit-logs/pdf")
def audit_logs_pdf(db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    rows = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(200).all()
    audit(db, user, "export", "audit_logs", "pdf")
    db.commit()
    return log_pdf(
        "Laporan Audit Log",
        ["User", "Aksi", "Modul", "Record", "IP", "Waktu"],
        [[row.user.name if row.user else "system", row.action, row.module, row.record_id, row.ip_address, row.created_at.strftime("%Y-%m-%d %H:%M")] for row in rows],
        "audit-log.pdf",
    )


@app.get("/error-logs/pdf")
def error_logs_pdf(db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin"))):
    rows = db.query(models.ErrorLog).order_by(models.ErrorLog.id.desc()).limit(200).all()
    audit(db, user, "export", "error_logs", "pdf")
    db.commit()
    return log_pdf(
        "Laporan Error Log",
        ["Severity", "Message", "Module", "Path", "Method", "Waktu"],
        [[row.severity, row.message, row.module, row.path, row.method, row.created_at.strftime("%Y-%m-%d %H:%M")] for row in rows],
        "error-log.pdf",
    )


@app.get("/audit-logs")
def audit_logs(db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return [{
        "id": row.id, "user": row.user.name if row.user else "system", "user_email": row.user.email if row.user else "system",
        "action": row.action, "module": row.module, "entity": row.module, "record_id": row.record_id,
        "ip_address": row.ip_address, "created_at": row.created_at
    } for row in db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(100).all()]


@app.get("/error-logs")
def error_logs(db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    return db.query(models.ErrorLog).order_by(models.ErrorLog.id.desc()).limit(100).all()


@app.post("/error-logs")
def create_error_log(payload: schemas.ErrorLogIn, db: Session = Depends(get_db), user: models.User = Depends(auth.require_roles("Admin", "Manajer Gudang"))):
    if payload.severity not in {"critical", "warning", "info"}:
        raise HTTPException(status_code=400, detail="Severity tidak valid")
    log = models.ErrorLog(**payload.model_dump())
    db.add(log)
    audit(db, user, "create", "error_logs", payload.severity)
    db.commit()
    return log


@app.get("/monitoring/resources")
@app.get("/monitoring")
def monitoring(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    response = random.randint(40, 260)
    status = "warning" if response > 200 else "healthy"
    alerts = []
    if response > 200:
        alerts.append("Response time melebihi threshold 200 ms")
        db.add(models.ErrorLog(severity="warning", message=alerts[0], module="monitoring", path="/monitoring/resources", method="GET"))
        db.commit()
    return {
        "cpu": random.randint(18, 82),
        "cpu_usage": random.randint(18, 82),
        "memory": random.randint(35, 88),
        "memory_usage": random.randint(35, 88),
        "response_time_ms": response,
        "uptime": "99.95%",
        "uptime_status": "Online",
        "status": status,
        "alerts": alerts,
    }
