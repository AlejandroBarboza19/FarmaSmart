# backend/app/models/farmacia.py

from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Farmacia(Base):
    __tablename__ = "farmacias"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    nombre        = Column(String(150), nullable=False)
    identificador = Column(String(60),  nullable=False, unique=True)
    direccion     = Column(String(255))
    telefono      = Column(String(20))
    email         = Column(String(120))
    activo        = Column(Boolean, nullable=False, default=True)
    created_at    = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # ── Relación inversa con Usuario ───────────────────────────
    # Permite hacer farmacia.usuarios y obtener la lista de usuarios.
    usuarios = relationship("Usuario", back_populates="farmacia")

    def __repr__(self):
        return f"<Farmacia id={self.id} identificador={self.identificador}>"