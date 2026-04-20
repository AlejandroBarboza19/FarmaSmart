from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from database import get_db
import models

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/")
def obtener_dashboard(db: Session = Depends(get_db)):

    hoy = date.today()
    limite_vencimiento = hoy + timedelta(days=30)

    # ─── 1. Resumen general ───────────────────────────────
    total_productos = db.query(models.Producto).filter(
        models.Producto.activo == True
    ).count()

    alertas_activas = db.query(models.Alerta).filter(
        models.Alerta.leida == False
    ).count()

    # ─── 2. Stock crítico ─────────────────────────────────
    # Productos donde stock_actual <= stock_minimo
    productos_criticos = (
        db.query(models.Producto)
        .filter(
            models.Producto.activo == True,
            models.Producto.stock_actual <= models.Producto.stock_minimo
        )
        .order_by(models.Producto.stock_actual.asc())
        .limit(10)
        .all()
    )

    # ─── 3. Productos próximos a vencer (30 días) ─────────
    lotes_por_vencer = (
        db.query(models.Lote)
        .filter(
            models.Lote.activo == True,
            models.Lote.cantidad_disponible > 0,
            models.Lote.fecha_vencimiento >= hoy,
            models.Lote.fecha_vencimiento <= limite_vencimiento
        )
        .order_by(models.Lote.fecha_vencimiento.asc())
        .limit(10)
        .all()
    )

    # ─── 4. Ventas del día (módulo pendiente) ─────────────
    ventas_hoy = {
        "total": 0,
        "cantidad_transacciones": 0,
        "modulo_pendiente": True  # ← se conecta cuando exista el módulo de ventas
    }

    # ─── Serializar manualmente ───────────────────────────
    return {
        "resumen": {
            "total_productos": total_productos,
            "alertas_activas": alertas_activas,
            "stock_critico_count": len(productos_criticos),
            "por_vencer_count": len(lotes_por_vencer),
        },
        "ventas_hoy": ventas_hoy,
        "stock_critico": [
            {
                "id": p.id,
                "nombre_comercial": p.nombre_comercial,
                "nombre_generico": p.nombre_generico,
                "stock_actual": p.stock_actual,
                "stock_minimo": p.stock_minimo,
                "laboratorio": p.laboratorio,
                "deficit": p.stock_minimo - p.stock_actual  # cuánto falta para llegar al mínimo
            }
            for p in productos_criticos
        ],
        "proximos_vencer": [
            {
                "id": l.id,
                "producto_id": l.producto_id,
                "nombre_comercial": l.producto.nombre_comercial,
                "numero_lote": l.numero_lote,
                "fecha_vencimiento": str(l.fecha_vencimiento),
                "dias_restantes": (l.fecha_vencimiento - hoy).days,
                "cantidad_disponible": l.cantidad_disponible
            }
            for l in lotes_por_vencer
        ]
    }