from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class TipoAlerta(str, enum.Enum):
    STOCK_MINIMO    = "STOCK_MINIMO"
    PROXIMO_VENCER  = "PROXIMO_VENCER"
    VENCIDO         = "VENCIDO"


class Alerta(Base):
    __tablename__ = "alertas"

    id          = Column(Integer, primary_key=True, index=True)
    farmacia_id = Column(Integer, ForeignKey("farmacias.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    lote_id     = Column(Integer, ForeignKey("lotes.id"), nullable=True)
    tipo        = Column(Enum(TipoAlerta), nullable=False)
    mensaje     = Column(String(255), nullable=False)
    leida       = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())