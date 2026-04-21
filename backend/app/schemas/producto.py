# ── 2. schemas/producto.py ─────────────────────────────────────
from pydantic import BaseModel
from decimal import Decimal
from typing import Optional, List
from datetime import datetime, date


# ── Lote dentro del create ─────────────────────────────────────
class PrimerLoteCreate(BaseModel):
    numero_lote:         str
    fecha_vencimiento:   date
    fecha_ingreso:       date
    cantidad_recibida:   int
    cantidad_disponible: int
    precio_compra:       float = 0.0


# ── Producto ───────────────────────────────────────────────────
class ProductoResponse(BaseModel):
    id:                 int
    nombre_comercial:   str
    nombre_generico:    str | None
    codigo_ean:         str
    forma_farmaceutica: str | None
    concentracion:      str | None
    laboratorio:        str | None
    precio_venta:       Decimal
    stock_actual:       int
    stock_minimo:       int

    class Config:
        from_attributes = True


class ProductoBase(BaseModel):
    nombre_comercial:   str
    nombre_generico:    Optional[str]   = None
    codigo_ean:         str
    forma_farmaceutica: Optional[str]   = None
    concentracion:      Optional[str]   = None
    laboratorio:        Optional[str]   = None
    precio_compra:      float           = 0.0
    precio_venta:       float           = 0.0
    stock_minimo:       int             = 0
    categoria_id:       Optional[int]   = None


class ProductoCreate(ProductoBase):
    # El primer lote es obligatorio al crear
    primer_lote: PrimerLoteCreate


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

class LoteResumen(BaseModel):
    id: int
    activo: bool
    class Config:
        from_attributes = True

class ProductoOut(ProductoBase):
    id:           int
    stock_actual: int
    activo:       bool
    created_at:   Optional[datetime]
    lotes:        List[LoteResumen] = []

    class Config:
        from_attributes = True
        
