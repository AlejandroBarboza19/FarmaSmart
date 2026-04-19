# backend/app/models/proveedor.py

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    farmacia_id = Column(Integer, ForeignKey("farmacias.id", ondelete="CASCADE"), nullable=False)
    nombre      = Column(String(150), nullable=False)
    contacto    = Column(String(120))
    telefono    = Column(String(20))
    email       = Column(String(120))
    activo      = Column(Boolean, nullable=False, default=True)
    created_at  = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    lotes = relationship("Lote", back_populates="proveedor", lazy="select")

    def __repr__(self):
        return f"<Proveedor id={self.id} nombre={self.nombre}>"