# app/schemas/venta.py

from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from app.models.venta import MetodoPago


class DetalleVentaRequest(BaseModel):
    producto_id: int
    cantidad:    int


class VentaRequest(BaseModel):
    metodo_pago:    MetodoPago
    monto_recibido: Decimal | None = None
    detalles:       list[DetalleVentaRequest]


class DetalleVentaResponse(BaseModel):
    producto_id:      int
    nombre_comercial: str
    cantidad:         int
    precio_unitario:  Decimal
    subtotal:         Decimal

    class Config:
        from_attributes = True


class VentaResponse(BaseModel):
    id:             int
    numero_ticket:  int
    subtotal:       Decimal
    iva:            Decimal
    total:          Decimal
    metodo_pago:    MetodoPago
    monto_recibido: Decimal | None
    cambio:         Decimal | None
    fecha_venta:    datetime
    detalles:       list[DetalleVentaResponse]

    class Config:
        from_attributes = True