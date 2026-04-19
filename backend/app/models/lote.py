# backend/app/models/lote.py

from sqlalchemy import Column, Integer, String, DECIMAL, Date, TIMESTAMP, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Lote(Base):
    __tablename__ = "lotes"

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    producto_id         = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"),  nullable=False)
    proveedor_id        = Column(Integer, ForeignKey("proveedores.id", ondelete="SET NULL"), nullable=True)
    numero_lote         = Column(String(80), nullable=False)
    fecha_vencimiento   = Column(Date,    nullable=False)
    fecha_ingreso       = Column(Date,    nullable=False)
    cantidad_recibida   = Column(Integer, nullable=False, default=0)
    cantidad_disponible = Column(Integer, nullable=False, default=0)
    precio_compra       = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    activo              = Column(Boolean, nullable=False, default=True)
    created_at          = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # ── Relaciones ─────────────────────────────────────────────
    producto = relationship("Producto", back_populates="lotes")
    proveedor = relationship("Proveedor", back_populates="lotes", lazy="joined")

    def __repr__(self):
        return f"<Lote id={self.id} numero={self.numero_lote} vence={self.fecha_vencimiento}>"