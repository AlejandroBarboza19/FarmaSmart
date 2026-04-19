# backend/app/api/ventas.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database       import get_db
from app.schemas.venta       import VentaRequest, VentaResponse
from app.schemas.auth        import UsuarioActual
from app.services.venta_service import registrar_venta
from app.services.auth_service  import get_current_user

router = APIRouter(prefix="/ventas", tags=["Ventas"])


# ── POST /ventas ───────────────────────────────────────────────
@router.post("", response_model=VentaResponse, status_code=201)
def endpoint_registrar_venta(
    datos:   VentaRequest,
    db:      Session       = Depends(get_db),
    usuario: UsuarioActual = Depends(get_current_user)
):
    """
    Registra una venta completa.
    Requiere token JWT en el header: Authorization: Bearer <token>
    """
    return registrar_venta(datos, usuario, db)