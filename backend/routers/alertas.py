from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from datetime import date
import models, schemas

router = APIRouter(
    prefix="/alertas",
    tags=["Alertas"]
)

# ─── GET /alertas/ ────────────────────────────────────────
# Lista todas las alertas no leídas
@router.get("/", response_model=List[schemas.AlertaOut])
def listar_alertas(
    solo_no_leidas: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(models.Alerta)
    if solo_no_leidas:
        query = query.filter(models.Alerta.leida == False)
    alertas = query.order_by(models.Alerta.created_at.desc()).all()
    return alertas


# ─── GET /alertas/resumen ─────────────────────────────────
# Conteo para el dashboard (badge de notificaciones)
@router.get("/resumen")
def resumen_alertas(db: Session = Depends(get_db)):
    total = db.query(models.Alerta).filter(
        models.Alerta.leida == False
    ).count()

    stock_minimo = db.query(models.Alerta).filter(
        models.Alerta.leida == False,
        models.Alerta.tipo == models.TipoAlerta.STOCK_MINIMO
    ).count()

    proximos_vencer = db.query(models.Alerta).filter(
        models.Alerta.leida == False,
        models.Alerta.tipo == models.TipoAlerta.PROXIMO_VENCER
    ).count()

    vencidos = db.query(models.Alerta).filter(
        models.Alerta.leida == False,
        models.Alerta.tipo == models.TipoAlerta.VENCIDO
    ).count()

    return {
        "total": total,
        "stock_minimo": stock_minimo,
        "proximos_vencer": proximos_vencer,
        "vencidos": vencidos
    }


# ─── GET /alertas/verificar ───────────────────────────────
# Escanea TODA la DB y genera alertas automáticamente
# Útil para correr al iniciar la app o con un cron job
@router.post("/verificar", status_code=200)
def verificar_todas_las_alertas(db: Session = Depends(get_db)):
    hoy = date.today()
    alertas_creadas = 0

    productos = db.query(models.Producto).filter(
        models.Producto.activo == True
    ).all()

    for producto in productos:
        # 1. Verificar stock mínimo
        if producto.stock_actual <= producto.stock_minimo:
            existe = db.query(models.Alerta).filter(
                models.Alerta.producto_id == producto.id,
                models.Alerta.tipo == models.TipoAlerta.STOCK_MINIMO,
                models.Alerta.leida == False
            ).first()
            if not existe:
                db.add(models.Alerta(
                    producto_id=producto.id,
                    tipo=models.TipoAlerta.STOCK_MINIMO,
                    mensaje=f"{producto.nombre_comercial}: stock bajo "
                            f"({producto.stock_actual} uds, mínimo {producto.stock_minimo})"
                ))
                alertas_creadas += 1

        # 2. Verificar lotes vencidos
        lotes_vencidos = [
            l for l in producto.lotes
            if l.activo and l.cantidad_disponible > 0
            and l.fecha_vencimiento < hoy
        ]
        for lote in lotes_vencidos:
            existe = db.query(models.Alerta).filter(
                models.Alerta.lote_id == lote.id,
                models.Alerta.tipo == models.TipoAlerta.VENCIDO,
                models.Alerta.leida == False
            ).first()
            if not existe:
                db.add(models.Alerta(
                    producto_id=producto.id,
                    lote_id=lote.id,
                    tipo=models.TipoAlerta.VENCIDO,
                    mensaje=f"Lote {lote.numero_lote} de {producto.nombre_comercial} "
                            f"venció el {lote.fecha_vencimiento}"
                ))
                alertas_creadas += 1

    db.commit()
    return {
        "mensaje": f"Verificación completada. {alertas_creadas} alertas nuevas generadas."
    }


# ─── PUT /alertas/{id}/leer ───────────────────────────────
# Marcar una alerta como leída
@router.put("/{id}/leer", response_model=schemas.AlertaOut)
def marcar_leida(id: int, db: Session = Depends(get_db)):
    alerta = db.query(models.Alerta).filter(
        models.Alerta.id == id
    ).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alerta.leida = True
    db.commit()
    db.refresh(alerta)
    return alerta


# ─── PUT /alertas/leer-todas ──────────────────────────────
# Marcar todas las alertas como leídas de un golpe
@router.put("/leer-todas", status_code=200)
def marcar_todas_leidas(db: Session = Depends(get_db)):
    db.query(models.Alerta).filter(
        models.Alerta.leida == False
    ).update({"leida": True})
    db.commit()
    return {"mensaje": "Todas las alertas marcadas como leídas"}