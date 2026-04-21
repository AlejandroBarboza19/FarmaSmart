from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime

class LoteBase(BaseModel):
    numero_lote:         str
    fecha_vencimiento:   date
    fecha_ingreso:       date
    cantidad_recibida:   int
    cantidad_disponible: int
    precio_compra:       float = 0.0
    proveedor_id:        Optional[int] = None

    @field_validator("fecha_vencimiento")
    @classmethod
    def fecha_no_pasada(cls, v):
        if v < date.today():
            raise ValueError("La fecha de vencimiento no puede ser en el pasado")
        return v

class LoteCreate(LoteBase):
    producto_id: int

class LoteOut(LoteBase):
    id:          int
    producto_id: int
    activo:      bool
    created_at:  Optional[datetime]
    class Config:
        from_attributes = True