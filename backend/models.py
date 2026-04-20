from sqlalchemy import (
    Column, Integer, String, Float, Date,
    DateTime, ForeignKey, Boolean, Text, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# ─── Enums ────────────────────────────────────────────────
class TipoAlerta(str, enum.Enum):
    STOCK_MINIMO   = "STOCK_MINIMO"
    PROXIMO_VENCER = "PROXIMO_VENCER"
    VENCIDO        = "VENCIDO"

# ─── Modelo: Categoría ────────────────────────────────────
class Categoria(Base):
    __tablename__ = "categorias"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255))

    # Relación inversa
    productos   = relationship("Producto", back_populates="categoria")

# ─── Modelo: Proveedor ────────────────────────────────────
class Proveedor(Base):
    __tablename__ = "proveedores"

    id       = Column(Integer, primary_key=True, index=True)
    nombre   = Column(String(150), nullable=False)
    contacto = Column(String(120))
    telefono = Column(String(20))
    email    = Column(String(120))
    activo   = Column(Boolean, default=True)

    lotes    = relationship("Lote", back_populates="proveedor")

# ─── Modelo: Producto (Medicamento) ───────────────────────
class Producto(Base):
    __tablename__ = "productos"

    id                 = Column(Integer, primary_key=True, index=True)
    categoria_id       = Column(Integer, ForeignKey("categorias.id"), nullable=True)

    nombre_comercial   = Column(String(200), nullable=False)
    nombre_generico    = Column(String(200))
    codigo_ean         = Column(String(60), unique=True, nullable=False, index=True)
    forma_farmaceutica = Column(String(80))   # tableta, jarabe, etc.
    concentracion      = Column(String(80))   # 500mg, 10mg/5ml, etc.
    laboratorio        = Column(String(150))
    precio_compra      = Column(Float, default=0.0)
    precio_venta       = Column(Float, default=0.0)
    stock_minimo       = Column(Integer, default=0)
    stock_actual       = Column(Integer, default=0)
    activo             = Column(Boolean, default=True)
    created_at         = Column(DateTime, server_default=func.now())
    updated_at         = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relaciones
    categoria = relationship("Categoria", back_populates="productos")
    lotes     = relationship("Lote", back_populates="producto",
                             cascade="all, delete-orphan")
    alertas   = relationship("Alerta", back_populates="producto",
                             cascade="all, delete-orphan")

# ─── Modelo: Lote ─────────────────────────────────────────
class Lote(Base):
    __tablename__ = "lotes"

    id                  = Column(Integer, primary_key=True, index=True)
    producto_id         = Column(Integer, ForeignKey("productos.id"), nullable=False)
    proveedor_id        = Column(Integer, ForeignKey("proveedores.id"), nullable=True)

    numero_lote         = Column(String(80), nullable=False)
    fecha_vencimiento   = Column(Date, nullable=False, index=True)
    fecha_ingreso       = Column(Date, nullable=False)
    cantidad_recibida   = Column(Integer, default=0)
    cantidad_disponible = Column(Integer, default=0)
    precio_compra       = Column(Float, default=0.0)
    activo              = Column(Boolean, default=True)
    created_at          = Column(DateTime, server_default=func.now())

    # Relaciones
    producto  = relationship("Producto", back_populates="lotes")
    proveedor = relationship("Proveedor", back_populates="lotes")
    alertas   = relationship("Alerta", back_populates="lote")

# ─── Modelo: Alerta ───────────────────────────────────────
class Alerta(Base):
    __tablename__ = "alertas"

    id          = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    lote_id     = Column(Integer, ForeignKey("lotes.id"),     nullable=True)
    tipo        = Column(Enum(TipoAlerta), nullable=False)
    mensaje     = Column(String(255), nullable=False)
    leida       = Column(Boolean, default=False)
    created_at  = Column(DateTime, server_default=func.now())

    # Relaciones
    producto = relationship("Producto", back_populates="alertas")
    lote     = relationship("Lote",    back_populates="alertas")