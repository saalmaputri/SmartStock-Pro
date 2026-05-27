from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str | None = None


class UserIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role_id: int
    is_active: bool = True

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        has_upper = any(char.isupper() for char in value)
        has_lower = any(char.islower() for char in value)
        has_digit = any(char.isdigit() for char in value)
        if not (has_upper and has_lower and has_digit):
            raise ValueError("Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, dan angka")
        return value


class CategoryIn(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class CategoryOut(CategoryIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SupplierIn(BaseModel):
    name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    is_active: bool = True


class SupplierOut(SupplierIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class WarehouseIn(BaseModel):
    name: str
    code: str = "WH"
    city: str = "Jakarta"
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool = True


class WarehouseOut(WarehouseIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProductIn(BaseModel):
    name: str
    sku: str = ""
    category_id: int | None = None
    supplier_id: int | None = None
    description: str | None = None
    image_url: str | None = None
    unit: str = "unit"
    purchase_price: float = 0
    selling_price: float = 0
    min_stock: int = 5
    is_active: bool = True


class ProductOut(ProductIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    price: float | None = None


class TransactionIn(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = Field(gt=0)
    transaction_type: str = "in"
    notes: str | None = None
    unit_price: float = 0


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    transaction_type: str | None = None
    product_id: int | None = None
    warehouse_id: int | None = None
    quantity: int | None = None
    notes: str | None = None
    created_at: datetime


class TransferIn(BaseModel):
    product_id: int
    warehouse_id: int | None = None
    target_warehouse_id: int | None = None
    source_warehouse_id: int | None = None
    destination_warehouse_id: int | None = None
    quantity: int = Field(gt=0)
    notes: str | None = None


class ErrorLogIn(BaseModel):
    severity: str
    message: str
    module: str | None = None
    path: str | None = None
    method: str | None = None
