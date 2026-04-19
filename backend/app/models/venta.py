# backend/app/models/venta.py

from sqlalchemy import Column, Integer, Enum, DECIMAL, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class MetodoPago(str, enum.Enum):
    EFECTIVO = "EFECTIVO"
    TARJETA  = "TARJETA"
    OTRO     = "OTRO"


class Venta(Base):
    __tablename__ = "ventas"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    farmacia_id    = Column(Integer, ForeignKey("farmacias.id", ondelete="CASCADE"), nullable=False)
    usuario_id     = Column(Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"),  nullable=False)
    numero_ticket  = Column(Integer, nullable=False)
    subtotal       = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    iva            = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    total          = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    metodo_pago    = Column(Enum(MetodoPago), nullable=False, default=MetodoPago.EFECTIVO)
    monto_recibido = Column(DECIMAL(12, 2))
    cambio         = Column(DECIMAL(12, 2))
    fecha_venta    = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # ── Relaciones ─────────────────────────────────────────────
    farmacia = relationship("Farmacia", lazy="joined")
    usuario  = relationship("Usuario",  lazy="joined")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Venta id={self.id} ticket={self.numero_ticket} total={self.total}>"