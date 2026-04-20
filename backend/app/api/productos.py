# backend/app/api/productos.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database           import get_db
from app.schemas.producto        import ProductoResponse
from app.schemas.auth            import UsuarioActual
from app.services.producto_service import listar_productos
from app.services.auth_service   import get_current_user

router = APIRouter(prefix="/productos", tags=["Productos"])


# ── GET /productos ─────────────────────────────────────────────
@router.get("", response_model=list[ProductoResponse])
def endpoint_listar_productos(
    db:      Session       = Depends(get_db),
    usuario: UsuarioActual = Depends(get_current_user)
):
    """
    Devuelve todos los productos activos de la farmacia.
    Requiere token JWT.
    """
    return listar_productos(usuario, db)