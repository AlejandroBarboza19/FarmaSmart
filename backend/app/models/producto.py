# backend/app/models/producto.py

from sqlalchemy import Column, Integer, String, DECIMAL, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    farmacia_id        = Column(Integer, ForeignKey("farmacias.id", ondelete="CASCADE"), nullable=False)
    categoria_id       = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True)
    nombre_comercial   = Column(String(200), nullable=False)
    nombre_generico    = Column(String(200))
    codigo_ean         = Column(String(60),  nullable=False)
    forma_farmaceutica = Column(String(80))
    concentracion      = Column(String(80))
    laboratorio        = Column(String(150))
    precio_compra      = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    precio_venta       = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    stock_minimo       = Column(Integer, nullable=False, default=0)
    stock_actual       = Column(Integer, nullable=False, default=0)
    activo             = Column(Boolean, nullable=False, default=True)
    created_at         = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # ── Relaciones ─────────────────────────────────────────────
    lotes = relationship("Lote", back_populates="producto", lazy="select")
    categoria = relationship("Categoria", back_populates="productos", lazy="joined")

    def __repr__(self):
        return f"<Producto id={self.id} nombre={self.nombre_comercial}>"