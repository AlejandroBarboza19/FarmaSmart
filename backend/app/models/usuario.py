# backend/app/models/usuario.py

from sqlalchemy import Column, Integer, String, Enum, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


# ── Enum de roles ──────────────────────────────────────────────
# Se define en Python para que SQLAlchemy y el resto del código
# usen el mismo vocabulario que la columna ENUM de MySQL.
class RolUsuario(str, enum.Enum):
    ADMIN   = "ADMIN"
    EMPLEADO = "EMPLEADO"


# ── Modelo Usuario ─────────────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuarios"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    farmacia_id   = Column(Integer, ForeignKey("farmacias.id", ondelete="CASCADE"), nullable=False)
    nombre        = Column(String(120), nullable=False)
    email         = Column(String(120), nullable=False)
    password_hash = Column(String(255), nullable=False)  # nunca texto plano
    rol           = Column(Enum(RolUsuario), nullable=False, default=RolUsuario.EMPLEADO)
    activo        = Column(Boolean, nullable=False, default=True)
    created_at    = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # ── Relación con Farmacia ──────────────────────────────────
    # Permite hacer usuario.farmacia y obtener el objeto Farmacia completo.
    # lazy="joined" significa que SQLAlchemy trae la farmacia
    # en la misma consulta, sin un segundo viaje a la BD.
    farmacia = relationship("Farmacia", back_populates="usuarios", lazy="joined")

    def __repr__(self):
        return f"<Usuario id={self.id} email={self.email} rol={self.rol}>"