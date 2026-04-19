# backend/app/services/venta_service.py

from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.venta        import Venta, MetodoPago
from app.models.detalle_venta import DetalleVenta
from app.models.producto     import Producto
from app.models.lote         import Lote
from app.schemas.venta       import VentaRequest, VentaResponse, DetalleVentaResponse
from app.schemas.auth        import UsuarioActual

# IVA fijo del 19%
IVA = Decimal("0.19")


# ── Helpers ────────────────────────────────────────────────────

def _obtener_lotes_fefo(producto_id: int, farmacia_id: int, db: Session) -> list[Lote]:
    """
    Devuelve los lotes disponibles de un producto ordenados por
    fecha de vencimiento ascendente (FEFO — First Expired First Out).
    Solo lotes activos con cantidad disponible > 0.
    """
    return (
        db.query(Lote)
        .join(Producto)
        .filter(
            Lote.producto_id        == producto_id,
            Lote.cantidad_disponible > 0,
            Lote.activo             == True,
            Producto.farmacia_id    == farmacia_id
        )
        .order_by(Lote.fecha_vencimiento.asc())
        .all()
    )


def _siguiente_numero_ticket(farmacia_id: int, db: Session) -> int:
    """
    Genera el siguiente número de ticket consecutivo para la farmacia.
    Si no hay ventas previas empieza en 1.
    """
    ultima_venta = (
        db.query(Venta)
        .filter(Venta.farmacia_id == farmacia_id)
        .order_by(Venta.numero_ticket.desc())
        .first()
    )
    return (ultima_venta.numero_ticket + 1) if ultima_venta else 1


# ── Registrar venta ────────────────────────────────────────────

def registrar_venta(
    datos:   VentaRequest,
    usuario: UsuarioActual,
    db:      Session
) -> VentaResponse:
    """
    Registra una venta completa en una sola transacción.

    Pasos:
      1. Validar que venga al menos un producto
      2. Por cada producto validar stock y descontar lotes FEFO
      3. Calcular subtotal, IVA y total
      4. Validar pago en efectivo si aplica
      5. Crear la venta y sus detalles
      6. Actualizar stock_actual de cada producto
      7. Hacer commit y devolver el ticket
    """

    # 1. Validar que haya al menos un producto
    if not datos.detalles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La venta debe tener al menos un producto"
        )

    subtotal_total = Decimal("0")
    detalles_a_guardar = []  # acumula los movimientos de lotes

    # 2. Procesar cada línea del carrito
    for linea in datos.detalles:

        # Verificar que el producto existe y pertenece a la farmacia
        producto = db.query(Producto).filter(
            Producto.id         == linea.producto_id,
            Producto.farmacia_id == usuario.farmacia_id,
            Producto.activo     == True
        ).first()

        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto {linea.producto_id} no encontrado"
            )

        # Verificar stock general
        if producto.stock_actual < linea.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para {producto.nombre_comercial}. "
                       f"Disponible: {producto.stock_actual}, solicitado: {linea.cantidad}"
            )

        # Aplicar FEFO — descontar de los lotes más próximos a vencer
        lotes       = _obtener_lotes_fefo(linea.producto_id, usuario.farmacia_id, db)
        por_descontar = linea.cantidad

        movimientos_lote = []  # (lote, cantidad_descontada)

        for lote in lotes:
            if por_descontar == 0:
                break

            descuento = min(lote.cantidad_disponible, por_descontar)
            movimientos_lote.append((lote, descuento))
            por_descontar -= descuento

        # Si después de recorrer todos los lotes aún falta stock
        if por_descontar > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock en lotes insuficiente para {producto.nombre_comercial}"
            )

        # Calcular subtotal de esta línea
        subtotal_linea = producto.precio_venta * linea.cantidad
        subtotal_total += subtotal_linea

        detalles_a_guardar.append({
            "producto":         producto,
            "movimientos_lote": movimientos_lote,
            "cantidad":         linea.cantidad,
            "precio_unitario":  producto.precio_venta,
            "subtotal":         subtotal_linea
        })

    # 3. Calcular IVA y total
    iva_total   = (subtotal_total * IVA).quantize(Decimal("0.01"))
    total       = subtotal_total + iva_total

    # 4. Validar pago en efectivo
    cambio = None
    if datos.metodo_pago == MetodoPago.EFECTIVO:
        if not datos.monto_recibido:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe ingresar el monto recibido para pago en efectivo"
            )
        if datos.monto_recibido < total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Monto insuficiente. Total: {total}, recibido: {datos.monto_recibido}"
            )
        cambio = (datos.monto_recibido - total).quantize(Decimal("0.01"))

    try:
        # 5. Crear la venta
        venta = Venta(
            farmacia_id    = usuario.farmacia_id,
            usuario_id     = usuario.id,
            numero_ticket  = _siguiente_numero_ticket(usuario.farmacia_id, db),
            subtotal       = subtotal_total,
            iva            = iva_total,
            total          = total,
            metodo_pago    = datos.metodo_pago,
            monto_recibido = datos.monto_recibido,
            cambio         = cambio
        )
        db.add(venta)
        db.flush()  # genera venta.id sin hacer commit todavía

        # Crear detalles y actualizar lotes y stock
        detalles_response = []

        for item in detalles_a_guardar:
            producto = item["producto"]

            for lote, cantidad_descontada in item["movimientos_lote"]:

                # Crear línea de detalle
                detalle = DetalleVenta(
                    venta_id        = venta.id,
                    producto_id     = producto.id,
                    lote_id         = lote.id,
                    cantidad        = cantidad_descontada,
                    precio_unitario = item["precio_unitario"],
                    subtotal        = item["precio_unitario"] * cantidad_descontada
                )
                db.add(detalle)

                # 6. Actualizar cantidad disponible del lote
                lote.cantidad_disponible -= cantidad_descontada

            # Actualizar stock general del producto
            producto.stock_actual -= item["cantidad"]

            detalles_response.append(DetalleVentaResponse(
                producto_id=      producto.id,
                nombre_comercial= producto.nombre_comercial,
                cantidad=         item["cantidad"],
                precio_unitario=  item["precio_unitario"],
                subtotal=         item["subtotal"]
            ))

        # 7. Commit — guarda todo junto
        db.commit()
        db.refresh(venta)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

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
        detalles=       detalles_response
    )