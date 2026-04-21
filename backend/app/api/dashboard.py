# app/api/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.usuario import Usuario
from app.models.venta import Venta
import app.models as models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def obtener_dashboard(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    hace_7_dias      = hoy - timedelta(days=6)
    limite_vencimiento = hoy + timedelta(days=30)

    # ── Inventario ──────────────────────────────────────────────
    total_productos = db.query(models.Producto).filter(
        models.Producto.activo      == True,
        models.Producto.farmacia_id == usuario.farmacia_id
    ).count()

    productos_criticos = (
        db.query(models.Producto)
        .filter(
            models.Producto.activo      == True,
            models.Producto.farmacia_id == usuario.farmacia_id,
            models.Producto.stock_actual <= models.Producto.stock_minimo
        )
        .order_by(models.Producto.stock_actual.asc())
        .limit(10)
        .all()
    )

    alertas_activas = db.query(models.Alerta).filter(
        models.Alerta.leida      == False,
        models.Alerta.farmacia_id == usuario.farmacia_id
    ).count()

    # ── Lotes próximos a vencer ─────────────────────────────────
    lotes_por_vencer = (
        db.query(models.Lote)
        .join(models.Producto)
        .filter(
            models.Lote.activo             == True,
            models.Lote.cantidad_disponible > 0,
            models.Lote.fecha_vencimiento  >= hoy,
            models.Lote.fecha_vencimiento  <= limite_vencimiento,
            models.Producto.farmacia_id    == usuario.farmacia_id,
        )
        .order_by(models.Lote.fecha_vencimiento.asc())
        .limit(10)
        .all()
    )

    # ── Ventas de hoy ───────────────────────────────────────────
    ventas_hoy_row = (
        db.query(
            func.count(Venta.id).label("cantidad"),
            func.coalesce(func.sum(Venta.total), 0).label("total")
        )
        .filter(
            Venta.farmacia_id == usuario.farmacia_id,
            cast(Venta.fecha_venta, Date) == hoy
        )
        .first()
    )

    cantidad_hoy = ventas_hoy_row.cantidad or 0
    total_hoy    = float(ventas_hoy_row.total or 0)

    # ── Ventas recientes ────────────────────────────────────────
    ventas_recientes = (
        db.query(Venta)
        .filter(Venta.farmacia_id == usuario.farmacia_id)
        .order_by(Venta.fecha_venta.desc())
        .limit(10)
        .all()
    )

    # ── Gráfica últimos 7 días ──────────────────────────────────
    ventas_7_dias = (
        db.query(
            cast(Venta.fecha_venta, Date).label("dia"),
            func.count(Venta.id).label("cantidad"),
            func.coalesce(func.sum(Venta.total), 0).label("total")
        )
        .filter(
            Venta.farmacia_id == usuario.farmacia_id,
            cast(Venta.fecha_venta, Date) >= hace_7_dias,
            cast(Venta.fecha_venta, Date) <= hoy
        )
        .group_by(cast(Venta.fecha_venta, Date))
        .order_by(cast(Venta.fecha_venta, Date).asc())
        .all()
    )

    mapa_ventas = {
        str(r.dia): {"cantidad": r.cantidad, "total": float(r.total)}
        for r in ventas_7_dias
    }
    grafica = []
    for i in range(7):
        dia     = hace_7_dias + timedelta(days=i)
        dia_str = str(dia)
        grafica.append({
            "fecha":    dia_str,
            "dia":      dia.strftime("%A"),
            "cantidad": mapa_ventas.get(dia_str, {}).get("cantidad", 0),
            "total":    mapa_ventas.get(dia_str, {}).get("total", 0.0),
        })

    return {
        "resumen": {
            "total_productos":    total_productos,
            "alertas_activas":    alertas_activas,
            "stock_critico_count": len(productos_criticos),
        },
        "ventas_hoy": {
            "total":                  total_hoy,
            "cantidad_transacciones": cantidad_hoy,
            "modulo_pendiente":       False,
        },
        "tickets_hoy": cantidad_hoy,
        "ventas_recientes": [
            {
                "id":            v.id,
                "numero_ticket": v.numero_ticket,
                "total":         float(v.total),
                "metodo_pago":   v.metodo_pago.value,
                "fecha_venta":   v.fecha_venta.isoformat(),
                "items":         len(v.detalles),
            }
            for v in ventas_recientes
        ],
        "grafica_7_dias": grafica,
        "stock_critico": [
            {
                "id":               p.id,
                "nombre_comercial": p.nombre_comercial,
                "nombre_generico":  p.nombre_generico,
                "stock_actual":     p.stock_actual,
                "stock_minimo":     p.stock_minimo,
                "laboratorio":      p.laboratorio,
                "deficit":          p.stock_minimo - p.stock_actual,
            }
            for p in productos_criticos
        ],
        # ✅ ESTO FALTABA
        "proximos_vencer": [
            {
                "id":                  l.id,
                "producto_id":         l.producto_id,
                "nombre_comercial":    l.producto.nombre_comercial,
                "numero_lote":         l.numero_lote,
                "fecha_vencimiento":   str(l.fecha_vencimiento),
                "dias_restantes":      (l.fecha_vencimiento - hoy).days,
                "cantidad_disponible": l.cantidad_disponible,
            }
            for l in lotes_por_vencer
        ],
    }