# backend/app/models/detalle_venta.py

from sqlalchemy import Column, Integer, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    venta_id        = Column(Integer, ForeignKey("ventas.id",    ondelete="CASCADE"),  nullable=False)
    producto_id     = Column(Integer, ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False)
    lote_id         = Column(Integer, ForeignKey("lotes.id",     ondelete="RESTRICT"), nullable=False)
    cantidad        = Column(Integer,      nullable=False)
    precio_unitario = Column(DECIMAL(12, 2), nullable=False)
    subtotal        = Column(DECIMAL(12, 2), nullable=False)

    # ── Relaciones ─────────────────────────────────────────────
    venta    = relationship("Venta",    back_populates="detalles")
    producto = relationship("Producto", lazy="joined")
    lote     = relationship("Lote",     lazy="joined")

    def __repr__(self):
        return f"<DetalleVenta venta={self.venta_id} producto={self.producto_id} cantidad={self.cantidad}>"