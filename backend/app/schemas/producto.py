# backend/app/schemas/producto.py

from pydantic import BaseModel
from decimal import Decimal


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