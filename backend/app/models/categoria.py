# backend/app/models/categoria.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    farmacia_id = Column(Integer, ForeignKey("farmacias.id", ondelete="CASCADE"), nullable=False)
    nombre      = Column(String(100), nullable=False)
    descripcion = Column(String(255))

    productos = relationship("Producto", back_populates="categoria", lazy="select")

    def __repr__(self):
        return f"<Categoria id={self.id} nombre={self.nombre}>"