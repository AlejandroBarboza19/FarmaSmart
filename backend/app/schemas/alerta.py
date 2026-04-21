from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AlertaCreate(BaseModel):
    producto_id: Optional[int] = None
    lote_id:     Optional[int] = None
    tipo:        str
    mensaje:     str

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