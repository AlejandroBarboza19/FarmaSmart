from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.models.venta import Venta
from app.schemas.venta import VentaRequest, VentaResponse, DetalleVentaResponse
from app.schemas.auth import UsuarioActual
from app.services.venta_service import registrar_venta
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.post("", response_model=VentaResponse, status_code=201)
def endpoint_registrar_venta(
    datos:   VentaRequest,
    db:      Session       = Depends(get_db),
    usuario: UsuarioActual = Depends(get_current_user)
):
    return registrar_venta(datos, usuario, db)


@router.get("/{id}", response_model=VentaResponse)
def obtener_venta(
    id:      int,
    db:      Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.detalles))
        .filter(
            Venta.id          == id,
            Venta.farmacia_id == usuario.farmacia_id
        )
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    return VentaResponse(
        id=             venta.id,
        numero_ticket=  venta.numero_ticket,
        subtotal=       venta.subtotal,
        iva=            venta.iva,
        total=          venta.total,
        metodo_pago=    venta.metodo_pago,
        monto_recibido= venta.monto_recibido,
        cambio=         venta.cambio,
        fecha_venta=    venta.fecha_venta,
        detalles=[
            DetalleVentaResponse(
                producto_id=      d.producto_id,
                nombre_comercial= d.producto.nombre_comercial,
                cantidad=         d.cantidad,
                precio_unitario=  d.precio_unitario,
                subtotal=         d.subtotal,
            )
            for d in venta.detalles
        ]
    )