# backend/app/schemas/venta.py

from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from app.models.venta import MetodoPago


# ── Línea de producto dentro de una venta ─────────────────────
# Esto es lo que el frontend envía por cada producto seleccionado
class DetalleVentaRequest(BaseModel):
    producto_id: int
    cantidad:    int


# ── Lo que ENTRA al endpoint POST /ventas ─────────────────────
class VentaRequest(BaseModel):
    metodo_pago:    MetodoPago
    monto_recibido: Decimal | None = None  # solo obligatorio si metodo_pago = EFECTIVO
    detalles:       list[DetalleVentaRequest]  # mínimo 1 producto


# ── Detalle de venta para la respuesta ────────────────────────
class DetalleVentaResponse(BaseModel):
    producto_id:     int
    nombre_comercial: str
    cantidad:        int
    precio_unitario: Decimal
    subtotal:        Decimal

    class Config:
        from_attributes = True


# ── Lo que SALE del endpoint POST /ventas (ticket) ────────────
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