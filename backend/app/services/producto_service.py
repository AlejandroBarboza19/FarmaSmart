# backend/app/services/producto_service.py

from sqlalchemy.orm import Session
from app.models.producto import Producto
from app.schemas.auth import UsuarioActual


def listar_productos(usuario: UsuarioActual, db: Session) -> list:
    """
    Devuelve todos los productos activos de la farmacia del usuario.
    Solo ve los productos de su propia farmacia (multi-tenant).
    """
    return (
        db.query(Producto)
        .filter(
            Producto.farmacia_id == usuario.farmacia_id,
            Producto.activo      == True
        )
        .order_by(Producto.nombre_comercial.asc())
        .all()
    )