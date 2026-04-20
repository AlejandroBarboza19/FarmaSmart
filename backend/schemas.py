from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

# ─── Categoría ────────────────────────────────────────────
class CategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaOut(CategoriaBase):
    id: int
    class Config:
        from_attributes = True

# ─── Proveedor ────────────────────────────────────────────
class ProveedorBase(BaseModel):
    nombre: str
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email:    Optional[str] = None

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorOut(ProveedorBase):
    id: int
    activo: bool
    class Config:
        from_attributes = True

# ─── Lote ─────────────────────────────────────────────────
class LoteBase(BaseModel):
    numero_lote:         str
    fecha_vencimiento:   date
    fecha_ingreso:       date
    cantidad_recibida:   int
    cantidad_disponible: int
    precio_compra:       float = 0.0
    proveedor_id:        Optional[int] = None

    # Validación: la fecha de vencimiento no puede ser pasada al registrar
    @field_validator("fecha_vencimiento")
    @classmethod
    def fecha_no_pasada(cls, v):
        if v < date.today():
            raise ValueError("La fecha de vencimiento no puede ser en el pasado")
        return v

class LoteCreate(LoteBase):
    producto_id: int

class LoteOut(LoteBase):
    id:         int
    producto_id: int
    activo:     bool
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

# ─── Producto ─────────────────────────────────────────────
class ProductoBase(BaseModel):
    nombre_comercial:   str
    nombre_generico:    Optional[str] = None
    codigo_ean:         str
    forma_farmaceutica: Optional[str] = None
    concentracion:      Optional[str] = None
    laboratorio:        Optional[str] = None
    precio_compra:      float = 0.0
    precio_venta:       float = 0.0
    stock_minimo:       int   = 0
    categoria_id:       Optional[int] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre_comercial:   Optional[str]   = None
    nombre_generico:    Optional[str]   = None
    forma_farmaceutica: Optional[str]   = None
    concentracion:      Optional[str]   = None
    laboratorio:        Optional[str]   = None
    precio_compra:      Optional[float] = None
    precio_venta:       Optional[float] = None
    stock_minimo:       Optional[int]   = None
    categoria_id:       Optional[int]   = None

class ProductoOut(ProductoBase):
    id:           int
    stock_actual: int
    activo:       bool
    created_at:   Optional[datetime]
    lotes:        List[LoteOut] = []
    categoria:    Optional[CategoriaOut] = None
    class Config:
        from_attributes = True

# ─── Alerta ───────────────────────────────────────────────
class AlertaOut(BaseModel):
    id:          int
    producto_id: Optional[int]
    lote_id:     Optional[int]
    tipo:        str
    mensaje:     str
    leida:       bool
    created_at:  Optional[datetime]
    class Config:
        from_attributes = True